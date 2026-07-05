import { Module } from '@nestjs/common';
import { CatalogRepository } from './repositories/catalog.repository';
import { CatalogService } from './services/catalog.service';

@Module({
  providers: [CatalogService, CatalogRepository],
  exports: [CatalogService, CatalogRepository],
})
export class CatalogDomainModule {}
