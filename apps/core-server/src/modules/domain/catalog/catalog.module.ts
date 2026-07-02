import { Module } from '@nestjs/common';
import { BusinessUnitDomainModule } from '../business-unit/business-unit.module';
import { CatalogRepository } from './repositories/catalog.repository';
import { CatalogService } from './services/catalog.service';

@Module({
  imports: [BusinessUnitDomainModule],
  providers: [CatalogService, CatalogRepository],
  exports: [CatalogService, CatalogRepository],
})
export class CatalogDomainModule {}
