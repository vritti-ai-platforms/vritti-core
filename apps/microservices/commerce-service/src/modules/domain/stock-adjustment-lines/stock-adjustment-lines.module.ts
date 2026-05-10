import { InventoryItemUomConversionsDomainModule } from '@domain/inventory-item-uom-conversions/inventory-item-uom-conversions.module';
import { InventoryItemsDomainModule } from '@domain/inventory-items/inventory-items.module';
import { StockAdjustmentLotsDomainModule } from '@domain/stock-adjustment-lots/stock-adjustment-lots.module';
import { StockAdjustmentsDomainModule } from '@domain/stock-adjustments/stock-adjustments.module';
import { Module } from '@nestjs/common';
import { StockAdjustmentLinesRepository } from './repositories/stock-adjustment-lines.repository';
import { StockAdjustmentLinesService } from './services/stock-adjustment-lines.service';

@Module({
  imports: [
    StockAdjustmentsDomainModule,
    StockAdjustmentLotsDomainModule,
    InventoryItemsDomainModule,
    InventoryItemUomConversionsDomainModule,
  ],
  providers: [StockAdjustmentLinesService, StockAdjustmentLinesRepository],
  exports: [StockAdjustmentLinesService, StockAdjustmentLinesRepository],
})
export class StockAdjustmentLinesDomainModule {}
