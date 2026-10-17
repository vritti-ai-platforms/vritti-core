import { Module } from '@nestjs/common';
import { CatalogCurrenciesDomainRepository } from './repositories/catalog-currencies.repository';
import { CatalogListingsDomainRepository } from './repositories/catalog-listings.repository';
import { CatalogsDomainRepository } from './repositories/catalogs.repository';
import { CatalogListingsDomainService } from './services/catalog-listings.service';
import { CatalogsDomainService } from './services/catalogs.service';

@Module({
  providers: [
    CatalogsDomainRepository,
    CatalogCurrenciesDomainRepository,
    CatalogListingsDomainRepository,
    CatalogsDomainService,
    CatalogListingsDomainService,
  ],
  exports: [CatalogsDomainService, CatalogListingsDomainService],
})
export class CatalogsDomainModule {}
