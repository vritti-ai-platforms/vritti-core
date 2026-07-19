import { Module } from '@nestjs/common';
import { LocationsDomainRepository } from './repositories/locations.repository';
import { LocationsDomainService } from './services/locations.service';

@Module({
  providers: [LocationsDomainService, LocationsDomainRepository],
  exports: [LocationsDomainService, LocationsDomainRepository],
})
export class LocationsDomainModule {}
