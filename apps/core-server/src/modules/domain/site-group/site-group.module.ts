import { Module } from '@nestjs/common';
import { CatalogDomainModule } from '../catalog/catalog.module';
import { SiteGroupRepository } from './repositories/site-group.repository';
import { SiteGroupService } from './services/site-group.service';

@Module({
  imports: [CatalogDomainModule],
  providers: [SiteGroupService, SiteGroupRepository],
  exports: [SiteGroupService, SiteGroupRepository],
})
export class SiteGroupDomainModule {}
