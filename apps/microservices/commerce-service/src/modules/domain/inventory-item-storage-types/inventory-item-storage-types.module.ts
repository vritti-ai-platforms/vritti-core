import { Module } from '@nestjs/common';
import { InventoryItemStorageTypesDomainRepository } from './repositories/inventory-item-storage-types.repository';
import { InventoryItemStorageTypesDomainService } from './services/inventory-item-storage-types.service';

@Module({
  providers: [InventoryItemStorageTypesDomainService, InventoryItemStorageTypesDomainRepository],
  exports: [InventoryItemStorageTypesDomainService],
})
export class InventoryItemStorageTypesDomainModule {}
