import { StorageTypesDomainModule } from '@domain/storage-types/storage-types.module';
import { Module } from '@nestjs/common';
import { StorageTypesRootController } from './root/storage-types-root.controller';

@Module({
  imports: [StorageTypesDomainModule],
  controllers: [StorageTypesRootController],
})
export class OrgStorageTypesModule {}
