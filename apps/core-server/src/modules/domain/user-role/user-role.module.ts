import { Module } from '@nestjs/common';
import { BusinessUnitDomainModule } from '../business-unit/business-unit.module';
import { OrganizationDomainModule } from '../organization/organization.module';
import { UserRoleAssignmentRepository } from './repositories/user-role-assignment.repository';
import { UserRoleService } from './services/user-role.service';

@Module({
  imports: [OrganizationDomainModule, BusinessUnitDomainModule],
  providers: [UserRoleService, UserRoleAssignmentRepository],
  exports: [UserRoleService, UserRoleAssignmentRepository],
})
export class UserRoleDomainModule {}
