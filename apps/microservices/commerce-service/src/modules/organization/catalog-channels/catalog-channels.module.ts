import { CatalogChannelsDomainModule } from '@domain/catalog-channels/catalog-channels.module';
import { Module } from '@nestjs/common';
import { OrgCatalogChannelsController } from './catalog-channels.controller';

@Module({
  imports: [CatalogChannelsDomainModule],
  controllers: [OrgCatalogChannelsController],
})
export class OrgCatalogChannelsModule {}
