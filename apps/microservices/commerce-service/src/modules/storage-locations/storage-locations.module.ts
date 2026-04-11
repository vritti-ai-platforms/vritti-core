import { StorageLocationsDomainModule } from '@domain/storage-locations/storage-locations.module';
import { Module } from '@nestjs/common';
import { StorageLocationsController } from './storage-locations.controller';

@Module({
  imports: [StorageLocationsDomainModule],
  controllers: [StorageLocationsController],
})
export class StorageLocationsModule {}
