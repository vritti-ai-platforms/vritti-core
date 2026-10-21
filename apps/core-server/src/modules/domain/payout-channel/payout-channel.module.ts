import { Module } from '@nestjs/common';
import { PayoutChannelDomainRepository } from './repositories/payout-channel.repository';
import { PayoutChannelDomainService } from './services/payout-channel.service';

@Module({
  providers: [PayoutChannelDomainService, PayoutChannelDomainRepository],
  exports: [PayoutChannelDomainService, PayoutChannelDomainRepository],
})
export class PayoutChannelDomainModule {}
