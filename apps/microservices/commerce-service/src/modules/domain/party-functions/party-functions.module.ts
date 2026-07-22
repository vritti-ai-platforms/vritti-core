import { Module } from '@nestjs/common';
import { PartyFunctionsDomainRepository } from './repositories/party-functions.repository';
import { PartyFunctionsDomainService } from './services/party-functions.service';

@Module({
  providers: [PartyFunctionsDomainService, PartyFunctionsDomainRepository],
  exports: [PartyFunctionsDomainService, PartyFunctionsDomainRepository],
})
export class PartyFunctionsDomainModule {}
