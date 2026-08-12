import { CatalogDomainService } from '@domain/catalog/services/catalog.service';
import { SiteDomainRepository } from '@domain/site/repositories/site.repository';
import { Injectable, Logger } from '@nestjs/common';
import type { FeatureUnlocks, ScopeType, SiteType, VersionSnapshot } from '@vritti/api-sdk/catalog-resolver';
import {
  type CreateResponseDto,
  type SelectOptionsQueryDto,
  type SelectQueryResult,
  SuccessResponseDto,
} from '@vritti/api-sdk/database';
import { BadRequestException, ConflictException, NotFoundException } from '@vritti/api-sdk/exceptions';
import { pluralize } from '@vritti/api-sdk/pluralize';
import type { Role } from '@/db/schema';
import { templateAssignableAtSite, validateGrantDependencies } from '@/rbac/permission-dependencies';
import { PermissionSetCacheService } from '@/rbac/services/permission-set-cache.service';
import type { CreateRoleInternalDto } from '../dto/request/create-role-internal.dto';
import type { UpdateRoleInternalDto } from '../dto/request/update-role-internal.dto';
import { OrganizationDomainRepository } from '../repositories/organization.repository';
import { RoleDomainRepository } from '../repositories/role.repository';

export type RoleWithCanDelete = Role & { assignedUserCount: number; canDelete: boolean };

export interface RolesByScope {
  ORG: RoleWithCanDelete[];
  LE: RoleWithCanDelete[];
  SITE_GROUP: RoleWithCanDelete[];
  SITE: Record<SiteType, RoleWithCanDelete[]>;
}

@Injectable()
export class RoleDomainService {
  private readonly logger = new Logger(RoleDomainService.name);

  constructor(
    private readonly roleRepository: RoleDomainRepository,
    private readonly organizationRepository: OrganizationDomainRepository,
    private readonly siteRepository: SiteDomainRepository,
    private readonly permissionSetCache: PermissionSetCacheService,
    private readonly catalogService: CatalogDomainService,
  ) {}

  // Rejects grants that enable a dependent permission without its prerequisite, against the active snapshot
  private async assertGrantDependencies(features: FeatureUnlocks): Promise<void> {
    const snapshot = await this.catalogService.getActiveSnapshot();
    if (!snapshot) return;
    validateGrantDependencies(features, snapshot);
  }

  // Derives a role's scope and site type from its template code in the active snapshot; a missing template is fatal
  private scopeFromSnapshot(
    snapshot: VersionSnapshot | null,
    businessCode: string | null | undefined,
    code: string,
  ): { scope: ScopeType; siteType: SiteType | null } {
    const template = businessCode ? snapshot?.businesses?.[businessCode]?.roleTemplates?.[code] : undefined;
    if (!template) {
      throw new NotFoundException({
        label: 'Role Template Not Found',
        detail: `Role template "${code}" not found in the active catalog.`,
        errors: [{ field: 'code', message: 'Unknown template code' }],
      });
    }
    return { scope: template.scope, siteType: template.scope === 'SITE' ? (template.siteType ?? null) : null };
  }

  // Groups the org's roles by scope (SITE by site type), flagging which are safe to delete (no user assignments)
  async findByOrgGrouped(orgId: string): Promise<RolesByScope> {
    const groups = await this.roleRepository.findByOrgGroupedByScope(orgId);
    const result: RolesByScope = {
      ORG: [],
      LE: [],
      SITE_GROUP: [],
      SITE: { OUTLET: [], WAREHOUSE: [], PRODUCTION: [] },
    };
    for (const group of groups) {
      const withCanDelete = group.roles.map((role) => ({ ...role, canDelete: role.assignedUserCount === 0 }));
      // SITE roles always carry a site type; other scopes are flat buckets
      if (group.scope === 'SITE') {
        if (group.siteType) result.SITE[group.siteType].push(...withCanDelete);
      } else {
        result[group.scope].push(...withCanDelete);
      }
    }
    return result;
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

    const [snapshot, org] = await Promise.all([
      this.catalogService.getActiveSnapshot(),
      this.organizationRepository.findById(orgId),
    ]);
    const { scope, siteType } = this.scopeFromSnapshot(snapshot, org?.businessCode, dto.code);

    const role = await this.roleRepository.create({
      organizationId: orgId,
      name: dto.name,
      description: dto.description,
      code: dto.code,
      scope,
      siteType,
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

    const [snapshot, org] = await Promise.all([
      this.catalogService.getActiveSnapshot(),
      this.organizationRepository.findById(role.organizationId),
    ]);

    const template = org?.businessCode
      ? snapshot?.businesses?.[org.businessCode]?.roleTemplates?.[role.code]
      : undefined;
    if (template && template.name === role.name) {
      throw new ConflictException({
        label: 'Default Role',
        detail: 'Default roles are immutable. Create a custom role to customize permissions.',
      });
    }

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

  // Clears a role's custom deltas so it tracks its base template again
  async resetToTemplate(roleId: string): Promise<SuccessResponseDto> {
    const role = await this.roleRepository.findById(roleId);
    if (!role) throw new NotFoundException('Role not found.');

    await this.roleRepository.update(roleId, { features: {}, revoked: null, updatedAt: new Date() });

    this.logger.log(`Reset role ${roleId} to its template`);
    return { success: true, message: 'Role reset to its template.' };
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

  // Returns the org's roles matching an exact scope as select options; SITE scope also matches on the site's type
  async findForSelect(
    orgId: string,
    query: SelectOptionsQueryDto,
    scope: ScopeType,
    siteId?: string,
  ): Promise<SelectQueryResult> {
    let siteType: SiteType | undefined;
    if (scope === 'SITE' && siteId) {
      const site = await this.siteRepository.findById(siteId);
      if (!site) throw new NotFoundException('Site not found.');
      siteType = site.type;
    }
    return this.roleRepository.findForSelectOptions(query, orgId, scope, siteType);
  }

  // One-time data routine: sets scope and site type on existing roles from their template code
  async backfillScopes(): Promise<{ updated: number }> {
    const snapshot = await this.catalogService.getActiveSnapshot();
    const orgs = await this.organizationRepository.findMany();
    const businessByOrg = new Map(orgs.map((org) => [org.id, org.businessCode]));

    const roles = await this.roleRepository.findMany();
    let updated = 0;
    for (const role of roles) {
      const { scope, siteType } = this.scopeFromSnapshot(snapshot, businessByOrg.get(role.organizationId), role.code);
      if (role.scope === scope && role.siteType === siteType) continue;
      await this.roleRepository.update(role.id, { scope, siteType, updatedAt: new Date() });
      updated++;
    }

    this.logger.log(`Backfilled scope for ${updated} of ${roles.length} ${pluralize('role', roles.length)}`);
    return { updated };
  }
}
