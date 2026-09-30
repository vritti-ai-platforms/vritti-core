import { CatalogChannelsDomainModule } from '@domain/catalog-channels/catalog-channels.module';
import { Module } from '@nestjs/common';
import { SiteAppCatalogChannelController } from './app/app-catalog-channel.controller';
import { SiteB2bCatalogChannelController } from './b2b/b2b-catalog-channel.controller';
import { SiteCatalogChannelsController } from './catalog-channels.controller';
import { SitePosCatalogChannelController } from './pos/pos-catalog-channel.controller';

@Module({
  imports: [CatalogChannelsDomainModule],
  controllers: [
    SiteCatalogChannelsController,
    SiteAppCatalogChannelController,
    SitePosCatalogChannelController,
    SiteB2bCatalogChannelController,
  ],
})
export class SiteCatalogChannelsModule {}
