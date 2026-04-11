import { Module } from '@nestjs/common';
import { StorageLocationsRepository } from './repositories/storage-locations.repository';
import { StorageLocationsService } from './services/storage-locations.service';

@Module({
  providers: [StorageLocationsService, StorageLocationsRepository],
  exports: [StorageLocationsService, StorageLocationsRepository],
})
export class StorageLocationsDomainModule {}
