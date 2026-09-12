import { CatalogChannelsDomainModule } from '@domain/catalog-channels/catalog-channels.module';
import { Module } from '@nestjs/common';
import { OrgAppCatalogChannelController } from './app/app-catalog-channel.controller';
import { OrgCatalogChannelsController } from './catalog-channels.controller';

@Module({
  imports: [CatalogChannelsDomainModule],
  controllers: [OrgCatalogChannelsController, OrgAppCatalogChannelController],
})
export class OrgCatalogChannelsModule {}
