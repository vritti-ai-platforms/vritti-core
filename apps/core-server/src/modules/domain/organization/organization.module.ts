import { Module } from '@nestjs/common';
import { CatalogDomainModule } from '../catalog/catalog.module';
import { SiteDomainModule } from '../site/site.module';
import { OrganizationRepository } from './repositories/organization.repository';
import { RoleRepository } from './repositories/role.repository';
import { OrganizationService } from './services/organization.service';
import { RoleService } from './services/role.service';

@Module({
  imports: [SiteDomainModule, CatalogDomainModule],
  providers: [OrganizationService, OrganizationRepository, RoleService, RoleRepository],
  exports: [OrganizationService, OrganizationRepository, RoleService, RoleRepository],
})
export class OrganizationDomainModule {}
