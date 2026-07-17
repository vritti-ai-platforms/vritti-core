import { Module } from '@nestjs/common';
import { PartyIdentifiersRepository } from './repositories/party-identifiers.repository';
import { PartyIdentifiersService } from './services/party-identifiers.service';

@Module({
  providers: [PartyIdentifiersService, PartyIdentifiersRepository],
  exports: [PartyIdentifiersService, PartyIdentifiersRepository],
})
export class PartyIdentifiersDomainModule {}
