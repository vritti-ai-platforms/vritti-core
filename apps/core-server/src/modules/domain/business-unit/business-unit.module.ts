import { Module } from '@nestjs/common';
import { CatalogDomainModule } from '../catalog/catalog.module';
import { BusinessUnitRepository } from './repositories/business-unit.repository';
import { BusinessUnitService } from './services/business-unit.service';

@Module({
  imports: [CatalogDomainModule],
  providers: [BusinessUnitService, BusinessUnitRepository],
  exports: [BusinessUnitService, BusinessUnitRepository],
})
export class BusinessUnitDomainModule {}
