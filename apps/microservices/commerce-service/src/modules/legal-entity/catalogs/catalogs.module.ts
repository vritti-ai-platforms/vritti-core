import { CatalogsDomainModule } from '@domain/catalogs/catalogs.module';
import { Module } from '@nestjs/common';
import { LeCatalogListingsController } from './listings/catalog-listings.controller';
import { LeCatalogsController } from './root/catalogs.controller';

@Module({
  imports: [CatalogsDomainModule],
  controllers: [LeCatalogsController, LeCatalogListingsController],
})
export class LeCatalogsModule {}
