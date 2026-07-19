import { Module } from '@nestjs/common';
import { CatalogDomainModule } from '../catalog/catalog.module';
import { OrganizationDomainModule } from '../organization/organization.module';
import { SiteDomainModule } from '../site/site.module';
import { UserRoleAssignmentDomainRepository } from './repositories/user-role-assignment.repository';
import { UserRoleDomainService } from './services/user-role.service';

@Module({
  imports: [OrganizationDomainModule, SiteDomainModule, CatalogDomainModule],
  providers: [UserRoleDomainService, UserRoleAssignmentDomainRepository],
  exports: [UserRoleDomainService, UserRoleAssignmentDomainRepository],
})
export class UserRoleDomainModule {}
