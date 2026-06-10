import { LocationQuantsDomainModule } from '@domain/locations/quants/location-quants.module';
import { Module } from '@nestjs/common';
import { LocationQuantsController } from './location-quants.controller';

@Module({
  imports: [LocationQuantsDomainModule],
  controllers: [LocationQuantsController],
})
export class LocationQuantsModule {}
