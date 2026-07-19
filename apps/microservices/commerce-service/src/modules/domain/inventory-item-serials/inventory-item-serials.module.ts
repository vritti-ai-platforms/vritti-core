import { Module } from '@nestjs/common';
import { InventoryItemSerialsDomainRepository } from './repositories/inventory-item-serials.repository';
import { InventoryItemSerialsDomainService } from './services/inventory-item-serials.service';

@Module({
  providers: [InventoryItemSerialsDomainService, InventoryItemSerialsDomainRepository],
  exports: [InventoryItemSerialsDomainService, InventoryItemSerialsDomainRepository],
})
export class InventoryItemSerialsDomainModule {}
