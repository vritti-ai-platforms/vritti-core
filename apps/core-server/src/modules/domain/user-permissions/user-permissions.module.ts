import { Module } from '@nestjs/common';
import { BusinessUnitDomainModule } from '../business-unit/business-unit.module';
import { CatalogDomainModule } from '../catalog/catalog.module';
import { OrganizationDomainModule } from '../organization/organization.module';
import { UserRoleDomainModule } from '../user-role/user-role.module';
import { UserPermissionsService } from './services/user-permissions.service';

@Module({
  imports: [UserRoleDomainModule, BusinessUnitDomainModule, OrganizationDomainModule, CatalogDomainModule],
  providers: [UserPermissionsService],
  exports: [UserPermissionsService],
})
export class UserPermissionsDomainModule {}
