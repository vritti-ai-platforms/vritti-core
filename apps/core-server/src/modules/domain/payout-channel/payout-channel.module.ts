import { Module } from '@nestjs/common';
import { PayoutChannelDomainRepository } from './repositories/payout-channel.repository';
import { PayoutChannelAccountDomainRepository } from './repositories/payout-channel-account.repository';
import { PayoutChannelDomainService } from './services/payout-channel.service';

@Module({
  providers: [PayoutChannelDomainService, PayoutChannelDomainRepository, PayoutChannelAccountDomainRepository],
  exports: [PayoutChannelDomainService, PayoutChannelDomainRepository],
})
export class PayoutChannelDomainModule {}
