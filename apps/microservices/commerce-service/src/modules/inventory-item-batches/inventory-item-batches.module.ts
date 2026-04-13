import { InventoryItemBatchesDomainModule } from '@domain/inventory-item-batches/inventory-item-batches.module';
import { InventoryLedgerDomainModule } from '@domain/inventory-ledger/inventory-ledger.module';
import { Module } from '@nestjs/common';
import { InventoryItemBatchesController } from './inventory-item-batches.controller';

@Module({
  imports: [InventoryItemBatchesDomainModule, InventoryLedgerDomainModule],
  controllers: [InventoryItemBatchesController],
})
export class InventoryItemBatchesModule {}
