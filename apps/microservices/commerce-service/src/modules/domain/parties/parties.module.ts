import { PartyCommunicationsDomainModule } from '@domain/party-communications/party-communications.module';
import { PartySocialProfilesDomainModule } from '@domain/party-social-profiles/party-social-profiles.module';
import { Module } from '@nestjs/common';
import { PartiesDomainRepository } from './repositories/parties.repository';
import { PartiesDomainService } from './services/parties.service';

@Module({
  imports: [PartyCommunicationsDomainModule, PartySocialProfilesDomainModule],
  providers: [PartiesDomainService, PartiesDomainRepository],
  exports: [PartiesDomainService, PartiesDomainRepository],
})
export class PartiesDomainModule {}
