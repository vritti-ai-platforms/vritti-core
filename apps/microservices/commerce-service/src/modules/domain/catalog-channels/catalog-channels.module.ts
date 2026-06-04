import { Module } from '@nestjs/common';
import { CatalogChannelsRepository } from './repositories/catalog-channels.repository';
import { CatalogChannelsService } from './services/catalog-channels.service';

@Module({
  providers: [CatalogChannelsService, CatalogChannelsRepository],
  exports: [CatalogChannelsService, CatalogChannelsRepository],
})
export class CatalogChannelsDomainModule {}
