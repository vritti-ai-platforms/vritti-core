import { Module } from '@nestjs/common';
import { StorageTypesDomainRepository } from './repositories/storage-types.repository';
import { StorageTypesDomainService } from './services/storage-types.service';

@Module({
  providers: [StorageTypesDomainService, StorageTypesDomainRepository],
  exports: [StorageTypesDomainService],
})
export class StorageTypesDomainModule {}
