import { StockAdjustmentLinesRepository } from '@domain/stock-adjustment-lines/repositories/stock-adjustment-lines.repository';
import { StockAdjustmentsDomainModule } from '@domain/stock-adjustments/stock-adjustments.module';
import { Module } from '@nestjs/common';
import { StockAdjustmentLineItemsRepository } from './repositories/stock-adjustment-line-items.repository';
import { StockAdjustmentLineItemsService } from './services/stock-adjustment-line-items.service';

@Module({
  imports: [StockAdjustmentsDomainModule],
  providers: [StockAdjustmentLineItemsService, StockAdjustmentLineItemsRepository, StockAdjustmentLinesRepository],
  exports: [StockAdjustmentLineItemsService, StockAdjustmentLineItemsRepository],
})
export class StockAdjustmentLineItemsDomainModule {}
