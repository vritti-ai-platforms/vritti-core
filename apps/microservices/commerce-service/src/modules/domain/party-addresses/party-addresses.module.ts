import { Module } from '@nestjs/common';
import { PartyAddressesRepository } from './repositories/party-addresses.repository';
import { PartyAddressesService } from './services/party-addresses.service';

@Module({
  providers: [PartyAddressesService, PartyAddressesRepository],
  exports: [PartyAddressesService, PartyAddressesRepository],
})
export class PartyAddressesDomainModule {}
