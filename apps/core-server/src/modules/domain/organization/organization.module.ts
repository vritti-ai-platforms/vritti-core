import { forwardRef, Module } from '@nestjs/common';
import { CatalogDomainModule } from '../catalog/catalog.module';
import { MediaDomainModule } from '../media/media.module';
import { SiteDomainModule } from '../site/site.module';
import { OrgServiceDomainRepository } from './repositories/org-service.repository';
import { OrganizationDomainRepository } from './repositories/organization.repository';
import { RoleDomainRepository } from './repositories/role.repository';
import { OrganizationDomainService } from './services/organization.service';
import { RoleDomainService } from './services/role.service';

@Module({
  // Circular by nature: media resolves an org's credential from the org row, and deleting an org has to purge
  // its objects. forwardRef on both sides is what lets the two modules reference each other.
  imports: [SiteDomainModule, CatalogDomainModule, forwardRef(() => MediaDomainModule)],
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
