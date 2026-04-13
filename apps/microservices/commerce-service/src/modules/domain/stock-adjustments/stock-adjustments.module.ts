import { InventoryItemBatchesDomainModule } from '@domain/inventory-item-batches/inventory-item-batches.module';
import { InventoryLedgerDomainModule } from '@domain/inventory-ledger/inventory-ledger.module';
import { StockAdjustmentLinesDomainModule } from '@domain/stock-adjustment-lines/stock-adjustment-lines.module';
import { Module } from '@nestjs/common';
import { StockAdjustmentsRepository } from './repositories/stock-adjustments.repository';
import { StockAdjustmentsService } from './services/stock-adjustments.service';

@Module({
  imports: [InventoryItemBatchesDomainModule, InventoryLedgerDomainModule, StockAdjustmentLinesDomainModule],
  providers: [StockAdjustmentsService, StockAdjustmentsRepository],
  exports: [StockAdjustmentsService, StockAdjustmentsRepository],
})
export class StockAdjustmentsDomainModule {}
