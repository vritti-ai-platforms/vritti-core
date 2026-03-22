import { Injectable, Logger } from '@nestjs/common';
import { ConflictException, NotFoundException, SuccessResponseDto } from '@vritti/api-sdk';
import type { OrgRole, RoleScope } from '@/db/schema';
import type { CreateRoleWebhookDto } from '../dto/request/create-role-webhook.dto';
import type { RoleItemDto } from '../dto/request/provision-roles-webhook.dto';
import type { UpdateRoleWebhookDto } from '../dto/request/update-role-webhook.dto';
import { OrgRoleRepository } from '../repositories/org-role.repository';

@Injectable()
export class OrgRoleService {
  private readonly logger = new Logger(OrgRoleService.name);

  constructor(private readonly orgRoleRepository: OrgRoleRepository) {}

  // Provisions multiple roles for an organization
  async provision(orgId: string, roles: RoleItemDto[]): Promise<SuccessResponseDto> {
    await this.orgRoleRepository.transaction(async (tx) => {
      for (const role of roles) {
        await this.orgRoleRepository.create(
          {
            organizationId: orgId,
            name: role.name,
            description: role.description,
            scope: role.scope as RoleScope,
            sourceRoleId: role.sourceRoleId,
            isLocked: role.isLocked,
            features: role.features,
          },
          tx,
        );
        this.logger.log(`Provisioned role "${role.name}" for org ${orgId}`);
      }
    });

    this.logger.log(`Provisioned ${roles.length} roles for org ${orgId}`);
    return { success: true, message: `${roles.length} role(s) provisioned successfully.` };
  }

  // Lists all roles for an organization
  async findByOrg(orgId: string): Promise<OrgRole[]> {
    return this.orgRoleRepository.findByOrg(orgId);
  }

  // Creates a single role with features as a string array
  async create(orgId: string, dto: CreateRoleWebhookDto): Promise<SuccessResponseDto> {
    const existing = await this.orgRoleRepository.findByOrgAndName(orgId, dto.name);
    if (existing) {
      throw new ConflictException({
        label: 'Role Already Exists',
        detail: `A role named "${dto.name}" already exists in this organization.`,
      });
    }

    await this.orgRoleRepository.create({
      organizationId: orgId,
      name: dto.name,
      description: dto.description,
      scope: dto.scope as RoleScope,
      sourceRoleId: dto.sourceRoleId,
      isLocked: dto.isLocked ?? false,
      features: dto.features,
    });

    this.logger.log(`Created role "${dto.name}" for org ${orgId}`);
    return { success: true, message: `Role "${dto.name}" created successfully.` };
  }

  // Updates role metadata and optionally replaces its features
  async update(roleId: string, dto: UpdateRoleWebhookDto): Promise<SuccessResponseDto> {
    const role = await this.orgRoleRepository.findById(roleId);
    if (!role) throw new NotFoundException('Role not found.');

    await this.orgRoleRepository.update(roleId, {
      ...(dto.name && { name: dto.name }),
      ...(dto.description !== undefined && { description: dto.description }),
      ...(dto.scope && { scope: dto.scope as RoleScope }),
      ...(dto.features !== undefined && { features: dto.features }),
      updatedAt: new Date(),
    });

    this.logger.log(`Updated role ${roleId}`);
    return { success: true, message: 'Role updated successfully.' };
  }

  // Deletes a role (cascade handles user_role_assignments)
  async remove(roleId: string): Promise<SuccessResponseDto> {
    const role = await this.orgRoleRepository.findById(roleId);
    if (!role) throw new NotFoundException('Role not found.');

    await this.orgRoleRepository.delete(roleId);

    this.logger.log(`Deleted role "${role.name}" (${roleId})`);
    return { success: true, message: 'Role deleted successfully.' };
  }
}
