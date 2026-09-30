import { CatalogChannelsDomainModule } from '@domain/catalog-channels/catalog-channels.module';
import { Module } from '@nestjs/common';
import { OrgAppCatalogChannelController } from './app/app-catalog-channel.controller';
import { OrgB2bCatalogChannelController } from './b2b/b2b-catalog-channel.controller';
import { OrgCatalogChannelsController } from './catalog-channels.controller';
import { OrgPosCatalogChannelController } from './pos/pos-catalog-channel.controller';

@Module({
  imports: [CatalogChannelsDomainModule],
  controllers: [
    OrgCatalogChannelsController,
    OrgAppCatalogChannelController,
    OrgPosCatalogChannelController,
    OrgB2bCatalogChannelController,
  ],
})
export class OrgCatalogChannelsModule {}
