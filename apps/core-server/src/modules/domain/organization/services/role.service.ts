import { CatalogService } from '@domain/catalog/services/catalog.service';
import { SiteRepository } from '@domain/site/repositories/site.repository';
import { Injectable, Logger } from '@nestjs/common';
import type { FeatureUnlocks, ScopeType } from '@vritti/api-sdk/catalog-resolver';
import { type CreateResponseDto, PrimaryDatabaseService, SuccessResponseDto } from '@vritti/api-sdk/database';
import { BadRequestException, ConflictException, NotFoundException } from '@vritti/api-sdk/exceptions';
import type { Role } from '@/db/schema';
import { templateAssignableAtSite, validateGrantDependencies } from '@/rbac/permission-dependencies';
import { PermissionSetCacheService } from '@/rbac/services/permission-set-cache.service';
import type { CreateRoleInternalDto } from '../dto/request/create-role-internal.dto';
import type { RoleItemDto } from '../dto/request/provision-roles-internal.dto';
import type { UpdateRoleInternalDto } from '../dto/request/update-role-internal.dto';
import { OrganizationRepository } from '../repositories/organization.repository';
import { RoleRepository } from '../repositories/role.repository';

@Injectable()
export class RoleService {
  private readonly logger = new Logger(RoleService.name);

  constructor(
    private readonly database: PrimaryDatabaseService,
    private readonly roleRepository: RoleRepository,
    private readonly organizationRepository: OrganizationRepository,
    private readonly siteRepository: SiteRepository,
    private readonly permissionSetCache: PermissionSetCacheService,
    private readonly catalogService: CatalogService,
  ) {}

  // Rejects grants that enable a dependent permission without its prerequisite, against the active snapshot
  private async assertGrantDependencies(features: FeatureUnlocks): Promise<void> {
    const snapshot = await this.catalogService.getActiveSnapshot();
    if (!snapshot) return;
    validateGrantDependencies(features, snapshot);
  }

  // Provisions template roles for an organization — creates a zero-delta stub per template code with no role yet
  async provision(orgId: string, roles: RoleItemDto[]): Promise<SuccessResponseDto> {
    const existing = await this.roleRepository.findByOrg(orgId);
    const existingCodes = new Set(existing.map((r) => r.code));
    let created = 0;

    await this.database.runInTransaction(async () => {
      for (const role of roles) {
        if (!role.code || existingCodes.has(role.code)) continue;
        await this.roleRepository.create({
          organizationId: orgId,
          name: role.name,
          description: role.description,
          code: role.code,
          features: {},
        });
        created++;
      }
    });

    this.logger.log(
      `Provisioned roles for org ${orgId}: ${created} created, ${roles.length - created} already present`,
    );
    return { success: true, message: `${created} role(s) provisioned.` };
  }

  // Lists all roles for an organization
  async findByOrg(orgId: string): Promise<Role[]> {
    return this.roleRepository.findByOrg(orgId);
  }

  // Creates a single role and returns it so the caller can navigate to the new record
  async create(orgId: string, dto: CreateRoleInternalDto): Promise<CreateResponseDto<Role>> {
    const existing = await this.roleRepository.findByOrgAndName(orgId, dto.name);
    if (existing) {
      throw new ConflictException({
        label: 'Role Already Exists',
        detail: `A role named "${dto.name}" already exists in this organization.`,
        errors: [{ field: 'name', message: 'Name already in use' }],
      });
    }

    await this.assertGrantDependencies(dto.features);

    const role = await this.roleRepository.create({
      organizationId: orgId,
      name: dto.name,
      description: dto.description,
      code: dto.code,
      features: dto.features,
      revoked: dto.revoked,
    });

    this.logger.log(`Created role "${dto.name}" for org ${orgId}`);
    return { success: true, message: `Role "${dto.name}" created successfully.`, data: role };
  }

  // Updates role metadata and optionally replaces its features
  async update(roleId: string, dto: UpdateRoleInternalDto): Promise<SuccessResponseDto> {
    const role = await this.roleRepository.findById(roleId);
    if (!role) throw new NotFoundException('Role not found.');

    // Renaming into another role's name would trip the unique index — surface it as a form field error instead
    if (dto.name && dto.name !== role.name) {
      const clash = await this.roleRepository.findByOrgAndName(role.organizationId, dto.name);
      if (clash) {
        throw new ConflictException({
          label: 'Role Already Exists',
          detail: `A role named "${dto.name}" already exists in this organization.`,
          errors: [{ field: 'name', message: 'Name already in use' }],
        });
      }
    }

    if (dto.features !== undefined) {
      await this.assertGrantDependencies(dto.features);
    }

    await this.roleRepository.update(roleId, {
      ...(dto.name && { name: dto.name }),
      ...(dto.description !== undefined && { description: dto.description }),
      ...(dto.features !== undefined && { features: dto.features }),
      ...(dto.revoked !== undefined && { revoked: dto.revoked }),
      updatedAt: new Date(),
    });

    // Custom role grant/revoke edits alter enabled sets for every assignee — drop the whole cache
    if (dto.features !== undefined || dto.revoked !== undefined) {
      await this.permissionSetCache.invalidateAll();
    }

    this.logger.log(`Updated role ${roleId}`);
    return { success: true, message: 'Role updated successfully.' };
  }

  // Deletes a role (cascade handles user_role_assignments)
  async remove(roleId: string): Promise<SuccessResponseDto> {
    const role = await this.roleRepository.findById(roleId);
    if (!role) throw new NotFoundException('Role not found.');

    await this.roleRepository.delete(roleId);

    this.logger.log(`Deleted role "${role.name}" (${roleId})`);
    return { success: true, message: 'Role deleted successfully.' };
  }

  // Returns the org's roles assignable at a site — SITE-scoped templates must target the site's type; custom/unknown roles always pass
  async findForSite(siteId: string): Promise<Role[]> {
    const site = await this.siteRepository.findById(siteId);
    if (!site) throw new NotFoundException('Site not found.');
    const roles = await this.roleRepository.findByOrg(site.organizationId);

    const [snapshot, org] = await Promise.all([
      this.catalogService.getActiveSnapshot(),
      this.organizationRepository.findById(site.organizationId),
    ]);
    const templates = org?.businessCode ? snapshot?.businesses?.[org.businessCode]?.roleTemplates : undefined;
    if (!templates) return roles;

    return roles.filter((role) => templateAssignableAtSite(templates[role.code], site.type));
  }

  // Returns the org's roles assignable at a target — templates scoped to the target's type plus SITE-scoped templates (any site type); custom/unknown roles always pass
  async findForTarget(orgId: string, targetType: string, targetId?: string): Promise<Role[]> {
    const scopes: ScopeType[] = ['ORG', 'LE', 'SITE_GROUP', 'SITE'];
    if (!scopes.includes(targetType as ScopeType)) {
      throw new BadRequestException({
        label: 'Invalid Target Type',
        detail: 'targetType must be one of ORG, LE, SITE_GROUP, or SITE.',
      });
    }

    // SITE targets keep the stricter site-type matching
    if (targetType === 'SITE') {
      if (!targetId) throw new BadRequestException('targetId is required for SITE targets.');
      return this.findForSite(targetId);
    }

    const roles = await this.roleRepository.findByOrg(orgId);
    const [snapshot, org] = await Promise.all([
      this.catalogService.getActiveSnapshot(),
      this.organizationRepository.findById(orgId),
    ]);
    const templates = org?.businessCode ? snapshot?.businesses?.[org.businessCode]?.roleTemplates : undefined;
    if (!templates) return roles;

    return roles.filter((role) => {
      const template = templates[role.code];
      return !template || template.scope === targetType || template.scope === 'SITE';
    });
  }
}
