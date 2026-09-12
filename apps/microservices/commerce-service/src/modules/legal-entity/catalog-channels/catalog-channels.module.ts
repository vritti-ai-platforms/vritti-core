import { CatalogChannelsDomainModule } from '@domain/catalog-channels/catalog-channels.module';
import { Module } from '@nestjs/common';
import { LeAppCatalogChannelController } from './app/app-catalog-channel.controller';
import { LeCatalogChannelsController } from './catalog-channels.controller';

@Module({
  imports: [CatalogChannelsDomainModule],
  controllers: [LeCatalogChannelsController, LeAppCatalogChannelController],
})
export class LeCatalogChannelsModule {}
