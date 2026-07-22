import { PartyFunctionsDomainModule } from '@domain/party-functions/party-functions.module';
import { Module } from '@nestjs/common';
import { PartyAddressesDomainRepository } from './repositories/party-addresses.repository';
import { PartyAddressesDomainService } from './services/party-addresses.service';

@Module({
  imports: [PartyFunctionsDomainModule],
  providers: [PartyAddressesDomainService, PartyAddressesDomainRepository],
  exports: [PartyAddressesDomainService, PartyAddressesDomainRepository],
})
export class PartyAddressesDomainModule {}
