import { Module } from '@nestjs/common';
import { LocationsRepository } from './repositories/locations.repository';
import { LocationsService } from './services/locations.service';

@Module({
  providers: [LocationsService, LocationsRepository],
  exports: [LocationsService, LocationsRepository],
})
export class LocationsDomainModule {}
