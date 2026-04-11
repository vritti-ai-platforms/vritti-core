import { Module } from '@nestjs/common';
import { InventoryItemBatchesDomainModule } from '@domain/inventory-item-batches/inventory-item-batches.module';
import { StockAdjustmentsRepository } from './repositories/stock-adjustments.repository';
import { StockAdjustmentsService } from './services/stock-adjustments.service';

@Module({
  imports: [InventoryItemBatchesDomainModule],
  providers: [StockAdjustmentsService, StockAdjustmentsRepository],
  exports: [StockAdjustmentsService, StockAdjustmentsRepository],
})
export class StockAdjustmentsDomainModule {}
