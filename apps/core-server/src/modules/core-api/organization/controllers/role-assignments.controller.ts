import type { AssignmentWithNames } from '@domain/user-role/repositories/user-role-assignment.repository';
import { UserRoleDomainService } from '@domain/user-role/services/user-role.service';
import { Controller, Get, Logger, UseGuards, UseInterceptors } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Public, SkipCsrf } from '@vritti/api-sdk/auth';
import { OrgIdHeader } from '@/security/decorators/org-id-header.decorator';
import { CloudSignatureGuard } from '@/security/guards/cloud-signature.guard';
import { OrgScopeInterceptor } from '@/security/interceptors/org-scope.interceptor';
import { ApiListOrgRoleAssignments } from '../docs/role-assignments.docs';

@ApiTags('Organization Role Assignments')
@Controller('organizations/internal')
@Public()
@SkipCsrf()
@UseGuards(CloudSignatureGuard)
@UseInterceptors(OrgScopeInterceptor)
export class RoleAssignmentsController {
  private readonly logger = new Logger(RoleAssignmentsController.name);

  constructor(private readonly userRoleService: UserRoleDomainService) {}

  // Lists org-wide role assignments (org resolved from the signed x-org-id header)
  @Get('role-assignments')
  @ApiListOrgRoleAssignments()
  async listOrgWide(@OrgIdHeader() orgId: string): Promise<AssignmentWithNames[]> {
    this.logger.log(`GET /organizations/internal/role-assignments — org ${orgId}`);
    return this.userRoleService.findOrgWide(orgId);
  }
}
