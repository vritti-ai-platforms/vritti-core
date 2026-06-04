import { Module } from '@nestjs/common';
import { SalesChannelsRepository } from './repositories/sales-channels.repository';
import { SalesChannelsService } from './services/sales-channels.service';

@Module({
  providers: [SalesChannelsService, SalesChannelsRepository],
  exports: [SalesChannelsService, SalesChannelsRepository],
})
export class SalesChannelsDomainModule {}
