import { Module } from '@nestjs/common';
import { CatalogDomainModule } from '../catalog/catalog.module';
import { OrganizationDomainModule } from '../organization/organization.module';
import { SiteDomainModule } from '../site/site.module';
import { UserRoleDomainModule } from '../user-role/user-role.module';
import { UserPermissionsDomainService } from './services/user-permissions.service';

@Module({
  imports: [UserRoleDomainModule, SiteDomainModule, OrganizationDomainModule, CatalogDomainModule],
  providers: [UserPermissionsDomainService],
  exports: [UserPermissionsDomainService],
})
export class UserPermissionsDomainModule {}
