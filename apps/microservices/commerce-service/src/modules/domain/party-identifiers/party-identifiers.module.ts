import { Module } from '@nestjs/common';
import { PartyIdentifiersDomainRepository } from './repositories/party-identifiers.repository';
import { PartyIdentifiersDomainService } from './services/party-identifiers.service';

@Module({
  providers: [PartyIdentifiersDomainService, PartyIdentifiersDomainRepository],
  exports: [PartyIdentifiersDomainService, PartyIdentifiersDomainRepository],
})
export class PartyIdentifiersDomainModule {}
