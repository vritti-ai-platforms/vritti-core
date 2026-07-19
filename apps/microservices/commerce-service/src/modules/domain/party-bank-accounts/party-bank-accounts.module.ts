import { Module } from '@nestjs/common';
import { PartyBankAccountsDomainRepository } from './repositories/party-bank-accounts.repository';
import { PartyBankAccountsDomainService } from './services/party-bank-accounts.service';

@Module({
  providers: [PartyBankAccountsDomainService, PartyBankAccountsDomainRepository],
  exports: [PartyBankAccountsDomainService, PartyBankAccountsDomainRepository],
})
export class PartyBankAccountsDomainModule {}
