import { Module } from '@nestjs/common';
import { PartyContactsDomainRepository } from './repositories/party-contacts.repository';
import { PartyContactsDomainService } from './services/party-contacts.service';

@Module({
  providers: [PartyContactsDomainService, PartyContactsDomainRepository],
  exports: [PartyContactsDomainService, PartyContactsDomainRepository],
})
export class PartyContactsDomainModule {}
