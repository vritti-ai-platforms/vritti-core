import { CatalogChannelsDomainModule } from '@domain/catalog-channels/catalog-channels.module';
import { Module } from '@nestjs/common';
import { LeAppCatalogChannelController } from './app/app-catalog-channel.controller';
import { LeB2bCatalogChannelController } from './b2b/b2b-catalog-channel.controller';
import { LeCatalogChannelsController } from './catalog-channels.controller';
import { LePosCatalogChannelController } from './pos/pos-catalog-channel.controller';

@Module({
  imports: [CatalogChannelsDomainModule],
  controllers: [
    LeCatalogChannelsController,
    LeAppCatalogChannelController,
    LePosCatalogChannelController,
    LeB2bCatalogChannelController,
  ],
})
export class LeCatalogChannelsModule {}
