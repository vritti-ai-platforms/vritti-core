import { Module } from '@nestjs/common';
import { SalesChannelsDomainRepository } from './repositories/sales-channels.repository';
import { SalesChannelsDomainService } from './services/sales-channels.service';

@Module({
  providers: [SalesChannelsDomainService, SalesChannelsDomainRepository],
  exports: [SalesChannelsDomainService, SalesChannelsDomainRepository],
})
export class SalesChannelsDomainModule {}
