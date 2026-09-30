import { CatalogsDomainModule } from '@domain/catalogs/catalogs.module';
import { Module } from '@nestjs/common';
import { SiteCatalogListingsController } from './listings/catalog-listings.controller';
import { SiteCatalogsController } from './root/catalogs.controller';

@Module({
  imports: [CatalogsDomainModule],
  controllers: [SiteCatalogsController, SiteCatalogListingsController],
})
export class SiteCatalogsModule {}
