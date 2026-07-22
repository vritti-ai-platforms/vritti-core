import { Module } from '@nestjs/common';
import { PartySocialProfilesDomainRepository } from './repositories/party-social-profiles.repository';
import { PartySocialProfilesDomainService } from './services/party-social-profiles.service';

@Module({
  providers: [PartySocialProfilesDomainService, PartySocialProfilesDomainRepository],
  exports: [PartySocialProfilesDomainService, PartySocialProfilesDomainRepository],
})
export class PartySocialProfilesDomainModule {}
