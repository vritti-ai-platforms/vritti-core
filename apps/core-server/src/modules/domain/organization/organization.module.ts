import { Module } from '@nestjs/common';
import { CatalogDomainModule } from '../catalog/catalog.module';
import { SiteDomainModule } from '../site/site.module';
import { OrgServiceDomainRepository } from './repositories/org-service.repository';
import { OrganizationDomainRepository } from './repositories/organization.repository';
import { RoleDomainRepository } from './repositories/role.repository';
import { OrganizationDomainService } from './services/organization.service';
import { RoleDomainService } from './services/role.service';

@Module({
  imports: [SiteDomainModule, CatalogDomainModule],
  providers: [
    OrganizationDomainService,
    OrganizationDomainRepository,
    OrgServiceDomainRepository,
    RoleDomainService,
    RoleDomainRepository,
  ],
  exports: [
    OrganizationDomainService,
    OrganizationDomainRepository,
    OrgServiceDomainRepository,
    RoleDomainService,
    RoleDomainRepository,
  ],
})
export class OrganizationDomainModule {}
