import { Module } from '@nestjs/common';
import { BusinessUnitDomainModule } from '../business-unit/business-unit.module';
import { CatalogDomainModule } from '../catalog/catalog.module';
import { OrganizationRepository } from './repositories/organization.repository';
import { RoleRepository } from './repositories/role.repository';
import { OrganizationService } from './services/organization.service';
import { RoleService } from './services/role.service';

@Module({
  imports: [BusinessUnitDomainModule, CatalogDomainModule],
  providers: [OrganizationService, OrganizationRepository, RoleService, RoleRepository],
  exports: [OrganizationService, OrganizationRepository, RoleService, RoleRepository],
})
export class OrganizationDomainModule {}
