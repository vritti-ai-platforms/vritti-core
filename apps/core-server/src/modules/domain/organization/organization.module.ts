import { Module } from '@nestjs/common';
import { CatalogDomainModule } from '../catalog/catalog.module';
import { SiteDomainModule } from '../site/site.module';
import { OrganizationDomainRepository } from './repositories/organization.repository';
import { RoleDomainRepository } from './repositories/role.repository';
import { OrganizationDomainService } from './services/organization.service';
import { RoleDomainService } from './services/role.service';

@Module({
  imports: [SiteDomainModule, CatalogDomainModule],
  providers: [OrganizationDomainService, OrganizationDomainRepository, RoleDomainService, RoleDomainRepository],
  exports: [OrganizationDomainService, OrganizationDomainRepository, RoleDomainService, RoleDomainRepository],
})
export class OrganizationDomainModule {}
