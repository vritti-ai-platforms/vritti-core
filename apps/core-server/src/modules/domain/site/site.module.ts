import { Module } from '@nestjs/common';
import { CatalogDomainModule } from '../catalog/catalog.module';
import { SiteDomainRepository } from './repositories/site.repository';
import { SiteDomainService } from './services/site.service';

@Module({
  imports: [CatalogDomainModule],
  providers: [SiteDomainService, SiteDomainRepository],
  exports: [SiteDomainService, SiteDomainRepository],
})
export class SiteDomainModule {}
