import { BusinessUnitRepository } from '@domain/business-unit/repositories/business-unit.repository';
import { RoleRepository } from '@domain/organization/repositories/role.repository';
import { Injectable, Logger } from '@nestjs/common';
import { NotFoundException, SuccessResponseDto } from '@vritti/api-sdk';
import type { AssignmentType, UserRoleAssignment } from '@/db/schema';
import { PermissionSetCacheService } from '@/rbac/services/permission-set-cache.service';
import type { AssignRoleInternalDto } from '../dto/request/assign-role-internal.dto';
import { UserRoleAssignmentRepository } from '../repositories/user-role-assignment.repository';

@Injectable()
export class UserRoleService {
  private readonly logger = new Logger(UserRoleService.name);

  constructor(
    private readonly userRoleAssignmentRepository: UserRoleAssignmentRepository,
    private readonly roleRepository: RoleRepository,
    private readonly businessUnitRepository: BusinessUnitRepository,
    private readonly permissionSetCache: PermissionSetCacheService,
  ) {}

  // Assigns (or replaces) a user's single role within a business unit
  async assignRole(userId: string, dto: AssignRoleInternalDto): Promise<SuccessResponseDto> {
    // Validate role exists
    const role = await this.roleRepository.findById(dto.roleId);
    if (!role) throw new NotFoundException('Role not found.');

    // Validate business unit exists
    const bu = await this.businessUnitRepository.findById(dto.businessUnitId);
    if (!bu) throw new NotFoundException('Business unit not found.');

    // One role per user per BU — replace the existing assignment's role if there is one
    const existing = await this.userRoleAssignmentRepository.findAssignmentByUserAndBU(userId, dto.businessUnitId);
    if (existing) {
      if (existing.roleId === dto.roleId) {
        return { success: true, message: 'Role already assigned.' };
      }
      await this.userRoleAssignmentRepository.update(existing.id, { roleId: dto.roleId, updatedAt: new Date() });
      await this.permissionSetCache.invalidate(userId, dto.businessUnitId);
      this.logger.log(`Updated role to "${role.name}" for user ${userId} in BU "${bu.name}"`);
      return { success: true, message: 'Role updated successfully.' };
    }

    await this.userRoleAssignmentRepository.create({
      userId,
      roleId: dto.roleId,
      businessUnitId: dto.businessUnitId,
      assignmentType: (dto.assignmentType as AssignmentType) ?? 'DIRECT',
    });

    await this.permissionSetCache.invalidate(userId, dto.businessUnitId);
    this.logger.log(`Assigned role "${role.name}" to user ${userId} in BU "${bu.name}"`);
    return { success: true, message: 'Role assigned successfully.' };
  }

  // Lists all role assignments for a user with role and business unit names
  async findRoleAssignments(
    userId: string,
  ): Promise<(UserRoleAssignment & { roleName: string; businessUnitName: string })[]> {
    return this.userRoleAssignmentRepository.findByUser(userId);
  }

  // Lists all role assignments for a business unit with user and role names
  async findByBusinessUnit(
    buId: string,
  ): Promise<(UserRoleAssignment & { userName: string; userEmail: string; roleName: string })[]> {
    return this.userRoleAssignmentRepository.findByBusinessUnit(buId);
  }

  // Removes a role assignment by ID
  async removeRoleAssignment(assignmentId: string): Promise<SuccessResponseDto> {
    const assignment = await this.userRoleAssignmentRepository.findById(assignmentId);
    if (!assignment) throw new NotFoundException('Role assignment not found.');

    await this.userRoleAssignmentRepository.delete(assignmentId);

    await this.permissionSetCache.invalidate(assignment.userId, assignment.businessUnitId);
    this.logger.log(`Removed role assignment ${assignmentId}`);
    return { success: true, message: 'Role assignment removed successfully.' };
  }
}
