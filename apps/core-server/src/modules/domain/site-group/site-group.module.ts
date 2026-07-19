import { Module } from '@nestjs/common';
import { CatalogDomainModule } from '../catalog/catalog.module';
import { SiteGroupDomainRepository } from './repositories/site-group.repository';
import { SiteGroupDomainService } from './services/site-group.service';

@Module({
  imports: [CatalogDomainModule],
  providers: [SiteGroupDomainService, SiteGroupDomainRepository],
  exports: [SiteGroupDomainService, SiteGroupDomainRepository],
})
export class SiteGroupDomainModule {}
