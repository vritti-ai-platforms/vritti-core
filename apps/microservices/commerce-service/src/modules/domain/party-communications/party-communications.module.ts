import { Module } from '@nestjs/common';
import { PartyCommunicationsDomainRepository } from './repositories/party-communications.repository';
import { PartyCommunicationsDomainService } from './services/party-communications.service';

@Module({
  providers: [PartyCommunicationsDomainService, PartyCommunicationsDomainRepository],
  exports: [PartyCommunicationsDomainService, PartyCommunicationsDomainRepository],
})
export class PartyCommunicationsDomainModule {}
