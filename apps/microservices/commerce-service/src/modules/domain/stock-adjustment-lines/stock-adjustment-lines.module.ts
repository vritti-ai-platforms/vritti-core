import { StockAdjustmentLineItemsDomainModule } from '@domain/stock-adjustment-line-items/stock-adjustment-line-items.module';
import { StockAdjustmentsDomainModule } from '@domain/stock-adjustments/stock-adjustments.module';
import { Module } from '@nestjs/common';
import { StockAdjustmentLinesRepository } from './repositories/stock-adjustment-lines.repository';
import { StockAdjustmentLinesService } from './services/stock-adjustment-lines.service';

@Module({
  imports: [StockAdjustmentsDomainModule, StockAdjustmentLineItemsDomainModule],
  providers: [StockAdjustmentLinesService, StockAdjustmentLinesRepository],
  exports: [StockAdjustmentLinesService, StockAdjustmentLinesRepository],
})
export class StockAdjustmentLinesDomainModule {}
