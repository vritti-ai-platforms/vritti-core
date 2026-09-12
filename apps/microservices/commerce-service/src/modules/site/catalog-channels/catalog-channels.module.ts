import { CatalogChannelsDomainModule } from '@domain/catalog-channels/catalog-channels.module';
import { Module } from '@nestjs/common';
import { SiteAppCatalogChannelController } from './app/app-catalog-channel.controller';
import { SiteCatalogChannelsController } from './catalog-channels.controller';

@Module({
  imports: [CatalogChannelsDomainModule],
  controllers: [SiteCatalogChannelsController, SiteAppCatalogChannelController],
})
export class SiteCatalogChannelsModule {}
