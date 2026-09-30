import { CatalogsDomainModule } from '@domain/catalogs/catalogs.module';
import { Module } from '@nestjs/common';
import { OrgCatalogListingsController } from './listings/catalog-listings.controller';
import { OrgCatalogsController } from './root/catalogs.controller';

@Module({
  imports: [CatalogsDomainModule],
  controllers: [OrgCatalogsController, OrgCatalogListingsController],
})
export class OrgCatalogsModule {}
