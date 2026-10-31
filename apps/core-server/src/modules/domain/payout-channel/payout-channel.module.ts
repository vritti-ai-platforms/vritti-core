import { Module } from '@nestjs/common';
import { PayoutChannelDomainRepository } from './repositories/payout-channel.repository';
import { PayoutChannelBankAccountDomainRepository } from './repositories/payout-channel-bank-account.repository';
import { PayoutChannelDomainService } from './services/payout-channel.service';

@Module({
  providers: [PayoutChannelDomainService, PayoutChannelBankAccountDomainRepository, PayoutChannelDomainRepository],
  exports: [PayoutChannelDomainService, PayoutChannelBankAccountDomainRepository],
})
export class PayoutChannelDomainModule {}
