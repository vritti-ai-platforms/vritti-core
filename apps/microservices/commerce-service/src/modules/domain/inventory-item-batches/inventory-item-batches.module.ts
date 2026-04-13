import { InventoryLedgerDomainModule } from '@domain/inventory-ledger/inventory-ledger.module';
import { Module } from '@nestjs/common';
import { InventoryItemBatchesRepository } from './repositories/inventory-item-batches.repository';
import { InventoryItemBatchesService } from './services/inventory-item-batches.service';

@Module({
  imports: [InventoryLedgerDomainModule],
  providers: [InventoryItemBatchesService, InventoryItemBatchesRepository],
  exports: [InventoryItemBatchesService, InventoryItemBatchesRepository],
})
export class InventoryItemBatchesDomainModule {}
