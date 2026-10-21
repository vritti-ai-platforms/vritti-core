import { Module } from '@nestjs/common';
import { PayoutAccountDomainRepository } from './repositories/payout-account.repository';
import { PayoutAccountDomainService } from './services/payout-account.service';

@Module({
  providers: [PayoutAccountDomainService, PayoutAccountDomainRepository],
  exports: [PayoutAccountDomainService, PayoutAccountDomainRepository],
})
export class PayoutAccountDomainModule {}
