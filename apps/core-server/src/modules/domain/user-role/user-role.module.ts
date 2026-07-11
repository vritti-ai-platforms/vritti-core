import { Module } from '@nestjs/common';
import { CatalogDomainModule } from '../catalog/catalog.module';
import { OrganizationDomainModule } from '../organization/organization.module';
import { SiteDomainModule } from '../site/site.module';
import { UserRoleAssignmentRepository } from './repositories/user-role-assignment.repository';
import { UserRoleService } from './services/user-role.service';

@Module({
  imports: [OrganizationDomainModule, SiteDomainModule, CatalogDomainModule],
  providers: [UserRoleService, UserRoleAssignmentRepository],
  exports: [UserRoleService, UserRoleAssignmentRepository],
})
export class UserRoleDomainModule {}
