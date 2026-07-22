import { PartyFunctionsDomainModule } from '@domain/party-functions/party-functions.module';
import { Module } from '@nestjs/common';
import { PartyRelationshipsDomainRepository } from './repositories/party-relationships.repository';
import { PartyRelationshipsDomainService } from './services/party-relationships.service';

@Module({
  imports: [PartyFunctionsDomainModule],
  providers: [PartyRelationshipsDomainService, PartyRelationshipsDomainRepository],
  exports: [PartyRelationshipsDomainService, PartyRelationshipsDomainRepository],
})
export class PartyRelationshipsDomainModule {}
