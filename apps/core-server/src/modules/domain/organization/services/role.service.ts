import { BusinessUnitRepository } from '@domain/business-unit/repositories/business-unit.repository';
import { Injectable, Logger } from '@nestjs/common';
import {
  ConflictException,
  type CreateResponseDto,
  NotFoundException,
  PrimaryDatabaseService,
  SuccessResponseDto,
} from '@vritti/api-sdk';
import type { Role } from '@/db/schema';
import type { CreateRoleInternalDto } from '../dto/request/create-role-internal.dto';
import type { RoleItemDto } from '../dto/request/provision-roles-internal.dto';
import type { UpdateRoleInternalDto } from '../dto/request/update-role-internal.dto';
import { RoleRepository } from '../repositories/role.repository';

@Injectable()
export class RoleService {
  private readonly logger = new Logger(RoleService.name);

  constructor(
    private readonly database: PrimaryDatabaseService,
    private readonly roleRepository: RoleRepository,
    private readonly businessUnitRepository: BusinessUnitRepository,
  ) {}

  // Provisions template roles for an organization — creates a zero-delta stub per template code that has no
  // role yet. Grants are NOT copied: they flow from the template at read time (a role with empty deltas
  // tracks its template exactly), so template edits reach every role without re-provisioning.
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

    await this.roleRepository.update(roleId, {
      ...(dto.name && { name: dto.name }),
      ...(dto.description !== undefined && { description: dto.description }),
      ...(dto.features !== undefined && { features: dto.features }),
      ...(dto.revoked !== undefined && { revoked: dto.revoked }),
      updatedAt: new Date(),
    });

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

  // Returns all roles for the business unit's organization (BUs no longer gate apps — no compatibility filtering)
  async findForBU(buId: string): Promise<Role[]> {
    const bu = await this.businessUnitRepository.findById(buId);
    if (!bu) throw new NotFoundException('Business unit not found.');
    return this.roleRepository.findByOrg(bu.organizationId);
  }
}
