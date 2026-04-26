import { InventoryItemLotsDomainModule } from '@domain/inventory-item-lots/inventory-item-lots.module';
import { StockAdjustmentLinesRepository } from '@domain/stock-adjustment-lines/repositories/stock-adjustment-lines.repository';
import { StockAdjustmentsDomainModule } from '@domain/stock-adjustments/stock-adjustments.module';
import { Module } from '@nestjs/common';
import { StockAdjustmentLotsRepository } from './repositories/stock-adjustment-lots.repository';
import { StockAdjustmentLotsService } from './services/stock-adjustment-lots.service';

@Module({
  imports: [StockAdjustmentsDomainModule, InventoryItemLotsDomainModule],
  providers: [StockAdjustmentLotsService, StockAdjustmentLotsRepository, StockAdjustmentLinesRepository],
  exports: [StockAdjustmentLotsService, StockAdjustmentLotsRepository],
})
export class StockAdjustmentLotsDomainModule {}
