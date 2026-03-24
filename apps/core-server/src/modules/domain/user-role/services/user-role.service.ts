import { Injectable, Logger } from '@nestjs/common';
import { ConflictException, NotFoundException, SuccessResponseDto } from '@vritti/api-sdk';
import type { AssignmentType, UserRoleAssignment } from '@/db/schema';
import { BusinessUnitRepository } from '@domain/business-unit/repositories/business-unit.repository';
import { OrgRoleRepository } from '@domain/organization/repositories/org-role.repository';
import type { AssignRoleWebhookDto } from '../dto/request/assign-role-webhook.dto';
import { UserRoleAssignmentRepository } from '../repositories/user-role-assignment.repository';

@Injectable()
export class UserRoleService {
  private readonly logger = new Logger(UserRoleService.name);

  constructor(
    private readonly userRoleAssignmentRepository: UserRoleAssignmentRepository,
    private readonly orgRoleRepository: OrgRoleRepository,
    private readonly businessUnitRepository: BusinessUnitRepository,
  ) {}

  // Assigns a role to a user within a business unit
  async assignRole(userId: string, dto: AssignRoleWebhookDto): Promise<SuccessResponseDto> {
    // Validate role exists
    const role = await this.orgRoleRepository.findById(dto.orgRoleId);
    if (!role) throw new NotFoundException('Role not found.');

    // Validate business unit exists
    const bu = await this.businessUnitRepository.findById(dto.businessUnitId);
    if (!bu) throw new NotFoundException('Business unit not found.');

    // Check for duplicate assignment
    const existing = await this.userRoleAssignmentRepository.findByUserAndRoleAndBU(
      userId,
      dto.orgRoleId,
      dto.businessUnitId,
    );
    if (existing) {
      throw new ConflictException({
        label: 'Duplicate Assignment',
        detail: `This user already has the role "${role.name}" assigned in business unit "${bu.name}".`,
      });
    }

    await this.userRoleAssignmentRepository.create({
      userId,
      orgRoleId: dto.orgRoleId,
      businessUnitId: dto.businessUnitId,
      assignmentType: (dto.assignmentType as AssignmentType) ?? 'DIRECT',
    });

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

    this.logger.log(`Removed role assignment ${assignmentId}`);
    return { success: true, message: 'Role assignment removed successfully.' };
  }
}
