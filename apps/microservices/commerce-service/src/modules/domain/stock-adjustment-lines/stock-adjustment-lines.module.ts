import { Module } from '@nestjs/common';
import { StockAdjustmentLinesRepository } from './repositories/stock-adjustment-lines.repository';
import { StockAdjustmentLinesService } from './services/stock-adjustment-lines.service';

@Module({
  providers: [StockAdjustmentLinesService, StockAdjustmentLinesRepository],
  exports: [StockAdjustmentLinesService, StockAdjustmentLinesRepository],
})
export class StockAdjustmentLinesDomainModule {}
