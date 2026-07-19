import { Module } from '@nestjs/common';
import { CatalogDomainRepository } from './repositories/catalog.repository';
import { CatalogDomainService } from './services/catalog.service';

@Module({
  providers: [CatalogDomainService, CatalogDomainRepository],
  exports: [CatalogDomainService, CatalogDomainRepository],
})
export class CatalogDomainModule {}
