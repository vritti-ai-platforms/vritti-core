import { Module } from '@nestjs/common';
import { PartyRelationshipsRepository } from './repositories/party-relationships.repository';
import { PartyRelationshipsService } from './services/party-relationships.service';

@Module({
  providers: [PartyRelationshipsService, PartyRelationshipsRepository],
  exports: [PartyRelationshipsService, PartyRelationshipsRepository],
})
export class PartyRelationshipsDomainModule {}
