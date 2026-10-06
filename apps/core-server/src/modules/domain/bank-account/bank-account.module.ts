import { Module } from '@nestjs/common';
import { BankAccountDomainRepository } from './repositories/bank-account.repository';
import { BankAccountDomainService } from './services/bank-account.service';

@Module({
  providers: [BankAccountDomainService, BankAccountDomainRepository],
  exports: [BankAccountDomainService, BankAccountDomainRepository],
})
export class BankAccountDomainModule {}
