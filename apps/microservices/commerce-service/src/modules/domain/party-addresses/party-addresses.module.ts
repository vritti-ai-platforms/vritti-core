import { Module } from '@nestjs/common';
import { PartyAddressesDomainRepository } from './repositories/party-addresses.repository';
import { PartyAddressesDomainService } from './services/party-addresses.service';

@Module({
  providers: [PartyAddressesDomainService, PartyAddressesDomainRepository],
  exports: [PartyAddressesDomainService, PartyAddressesDomainRepository],
})
export class PartyAddressesDomainModule {}
