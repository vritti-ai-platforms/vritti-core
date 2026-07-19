import { Module } from '@nestjs/common';
import { CatalogChannelsDomainRepository } from './repositories/catalog-channels.repository';
import { CatalogChannelsDomainService } from './services/catalog-channels.service';

@Module({
  providers: [CatalogChannelsDomainService, CatalogChannelsDomainRepository],
  exports: [CatalogChannelsDomainService, CatalogChannelsDomainRepository],
})
export class CatalogChannelsDomainModule {}
