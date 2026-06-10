import { Module } from '@nestjs/common';
import { LocationQuantsRepository } from './location-quants.repository';
import { LocationQuantsService } from './location-quants.service';

@Module({
  providers: [LocationQuantsService, LocationQuantsRepository],
  exports: [LocationQuantsService],
})
export class LocationQuantsDomainModule {}
