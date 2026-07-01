import { Injectable, Logger } from '@nestjs/common';
import { ConflictException, NotFoundException, PrimaryDatabaseService, SuccessResponseDto } from '@vritti/api-sdk';
import type { Role } from '@/db/schema';
import { BusinessUnitRepository } from '@domain/business-unit/repositories/business-unit.repository';
import type { CreateRoleWebhookDto } from '../dto/request/create-role-webhook.dto';
import type { RoleItemDto } from '../dto/request/provision-roles-webhook.dto';
import type { UpdateRoleWebhookDto } from '../dto/request/update-role-webhook.dto';
import { RoleRepository } from '../repositories/role.repository';

@Injectable()
export class RoleService {
  private readonly logger = new Logger(RoleService.name);

  constructor(
    private readonly database: PrimaryDatabaseService,
    private readonly roleRepository: RoleRepository,
    private readonly businessUnitRepository: BusinessUnitRepository,
  ) {}

  // Provisions role templates for an organization — creates new templates, updates existing ones by code
  async provision(orgId: string, roles: RoleItemDto[]): Promise<SuccessResponseDto> {
    const existing = await this.roleRepository.findByOrg(orgId);
    const byCode = new Map(existing.filter((r) => r.code).map((r) => [r.code, r]));
    let created = 0;
    let updated = 0;

    await this.database.runInTransaction(async () => {
      for (const role of roles) {
        const match = role.code ? byCode.get(role.code) : undefined;
        if (match) {
          await this.roleRepository.update(match.id, {
            name: role.name,
            description: role.description,
            features: role.features,
            updatedAt: new Date(),
          });
          updated++;
        } else {
          await this.roleRepository.create({
            organizationId: orgId,
            name: role.name,
            description: role.description,
            code: role.code,
            features: role.features,
          });
          created++;
        }
      }
    });

    this.logger.log(`Provisioned roles for org ${orgId}: ${created} created, ${updated} updated`);
    return { success: true, message: `${created} role(s) created, ${updated} updated.` };
  }

  // Lists all roles for an organization
  async findByOrg(orgId: string): Promise<Role[]> {
    return this.roleRepository.findByOrg(orgId);
  }

  // Creates a single role with features as a string array
  async create(orgId: string, dto: CreateRoleWebhookDto): Promise<SuccessResponseDto> {
    const existing = await this.roleRepository.findByOrgAndName(orgId, dto.name);
    if (existing) {
      throw new ConflictException({
        label: 'Role Already Exists',
        detail: `A role named "${dto.name}" already exists in this organization.`,
      });
    }

    await this.roleRepository.create({
      organizationId: orgId,
      name: dto.name,
      description: dto.description,
      code: dto.code,
      features: dto.features,
    });

    this.logger.log(`Created role "${dto.name}" for org ${orgId}`);
    return { success: true, message: `Role "${dto.name}" created successfully.` };
  }

  // Updates role metadata and optionally replaces its features
  async update(roleId: string, dto: UpdateRoleWebhookDto): Promise<SuccessResponseDto> {
    const role = await this.roleRepository.findById(roleId);
    if (!role) throw new NotFoundException('Role not found.');

    await this.roleRepository.update(roleId, {
      ...(dto.name && { name: dto.name }),
      ...(dto.description !== undefined && { description: dto.description }),
      ...(dto.features !== undefined && { features: dto.features }),
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
