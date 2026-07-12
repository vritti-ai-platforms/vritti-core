import { Module } from '@nestjs/common';
import { CatalogDomainModule } from '../catalog/catalog.module';
import { SiteRepository } from './repositories/site.repository';
import { SiteService } from './services/site.service';

@Module({
  imports: [CatalogDomainModule],
  providers: [SiteService, SiteRepository],
  exports: [SiteService, SiteRepository],
})
export class SiteDomainModule {}
