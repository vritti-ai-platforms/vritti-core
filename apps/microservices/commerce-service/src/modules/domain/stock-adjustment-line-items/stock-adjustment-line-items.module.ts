import { StockAdjustmentLinesDomainModule } from '@domain/stock-adjustment-lines/stock-adjustment-lines.module';
import { StockAdjustmentsDomainModule } from '@domain/stock-adjustments/stock-adjustments.module';
import { Module } from '@nestjs/common';
import { StockAdjustmentLineItemsRepository } from './repositories/stock-adjustment-line-items.repository';
import { StockAdjustmentLineItemsService } from './services/stock-adjustment-line-items.service';

@Module({
  imports: [StockAdjustmentsDomainModule, StockAdjustmentLinesDomainModule],
  providers: [StockAdjustmentLineItemsService, StockAdjustmentLineItemsRepository],
  exports: [StockAdjustmentLineItemsService, StockAdjustmentLineItemsRepository],
})
export class StockAdjustmentLineItemsDomainModule {}
