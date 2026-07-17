import { LocationsDomainModule } from '@domain/locations/locations.module';
import { Module } from '@nestjs/common';
import { LocationsController } from './root/locations.controller';

@Module({
  imports: [LocationsDomainModule],
  controllers: [LocationsController],
})
export class SiteLocationsModule {}
