import { Module } from '@nestjs/common';
import { PartyLicensesDomainRepository } from './repositories/party-licenses.repository';
import { PartyLicensesDomainService } from './services/party-licenses.service';

@Module({
  providers: [PartyLicensesDomainService, PartyLicensesDomainRepository],
  exports: [PartyLicensesDomainService, PartyLicensesDomainRepository],
})
export class PartyLicensesDomainModule {}
