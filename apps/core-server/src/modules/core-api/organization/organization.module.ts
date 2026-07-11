import { OrganizationDomainModule } from '@domain/organization/organization.module';
import { UserRoleDomainModule } from '@domain/user-role/user-role.module';
import { Module } from '@nestjs/common';
import { OrganizationController } from './controllers/organization.controller';
import { RoleAssignmentsController } from './controllers/role-assignments.controller';
import { RolesController } from './controllers/roles.controller';

@Module({
  imports: [OrganizationDomainModule, UserRoleDomainModule],
  controllers: [OrganizationController, RoleAssignmentsController, RolesController],
})
export class OrganizationApiModule {}
