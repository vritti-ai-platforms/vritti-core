import { Module } from '@nestjs/common';
import { PartyRelationshipsDomainRepository } from './repositories/party-relationships.repository';
import { PartyRelationshipsDomainService } from './services/party-relationships.service';

@Module({
  providers: [PartyRelationshipsDomainService, PartyRelationshipsDomainRepository],
  exports: [PartyRelationshipsDomainService, PartyRelationshipsDomainRepository],
})
export class PartyRelationshipsDomainModule {}
