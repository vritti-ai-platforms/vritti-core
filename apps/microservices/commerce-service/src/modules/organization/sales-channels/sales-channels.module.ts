import { SalesChannelsDomainModule } from '@domain/sales-channels/sales-channels.module';
import { Module } from '@nestjs/common';
import { SalesChannelsController } from './sales-channels.controller';

@Module({
  imports: [SalesChannelsDomainModule],
  controllers: [SalesChannelsController],
})
export class OrgSalesChannelsModule {}
