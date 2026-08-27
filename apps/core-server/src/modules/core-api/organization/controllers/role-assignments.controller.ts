import type { AssignmentWithNames } from '@domain/user-role/repositories/user-role-assignment.repository';
import { UserRoleDomainService } from '@domain/user-role/services/user-role.service';
import { Controller, Get, Logger } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AuthType, Require } from '@vritti/api-sdk/auth';
import { OrgId } from '@/security/decorators/org-id.decorator';
import { ApiListOrgRoleAssignments } from '../docs/role-assignments.docs';

@ApiTags('Organization Role Assignments')
@Controller('organizations/internal')
@Require(AuthType.Cloud)
export class RoleAssignmentsController {
  private readonly logger = new Logger(RoleAssignmentsController.name);

  constructor(private readonly userRoleService: UserRoleDomainService) {}

  // Lists org-wide role assignments (org resolved from the signed x-org-id header)
  @Get('role-assignments')
  @ApiListOrgRoleAssignments()
  async listOrgWide(@OrgId() orgId: string): Promise<AssignmentWithNames[]> {
    this.logger.log(`GET /organizations/internal/role-assignments — org ${orgId}`);
    return this.userRoleService.findOrgWide(orgId);
  }
}
