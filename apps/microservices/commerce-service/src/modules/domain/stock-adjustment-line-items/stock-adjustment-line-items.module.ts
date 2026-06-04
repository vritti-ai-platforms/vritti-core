import { Module } from '@nestjs/common';
import { StockAdjustmentLineItemsRepository } from './repositories/stock-adjustment-line-items.repository';
import { StockAdjustmentLineItemsService } from './services/stock-adjustment-line-items.service';

@Module({
  providers: [StockAdjustmentLineItemsService, StockAdjustmentLineItemsRepository],
  exports: [StockAdjustmentLineItemsService, StockAdjustmentLineItemsRepository],
})
export class StockAdjustmentLineItemsDomainModule {}
