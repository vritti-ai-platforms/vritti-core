import { Module } from '@nestjs/common';
import { StorageLocationConfigsRepository } from './repositories/storage-location-configs.repository';
import { StorageLocationConfigsService } from './services/storage-location-configs.service';

@Module({
  providers: [StorageLocationConfigsService, StorageLocationConfigsRepository],
  exports: [StorageLocationConfigsService],
})
export class StorageLocationConfigsDomainModule {}
