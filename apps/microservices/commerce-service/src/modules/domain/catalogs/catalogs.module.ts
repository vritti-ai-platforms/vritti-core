import { CatalogChannelsDomainModule } from '@domain/catalog-channels/catalog-channels.module';
import { Module } from '@nestjs/common';
import { CatalogsDomainRepository } from './repositories/catalogs.repository';
import { CatalogsDomainService } from './services/catalogs.service';

@Module({
  imports: [CatalogChannelsDomainModule],
  providers: [CatalogsDomainService, CatalogsDomainRepository],
  exports: [CatalogsDomainService, CatalogsDomainRepository],
})
export class CatalogsDomainModule {}
