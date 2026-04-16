import { Module } from '@nestjs/common';
import { StockAdjustmentLinesRepository } from '../stock-adjustment-lines/repositories/stock-adjustment-lines.repository';
import { StockAdjustmentsRepository } from './repositories/stock-adjustments.repository';
import { StockAdjustmentsService } from './services/stock-adjustments.service';

@Module({
  providers: [StockAdjustmentsService, StockAdjustmentsRepository, StockAdjustmentLinesRepository],
  exports: [StockAdjustmentsService, StockAdjustmentsRepository],
})
export class StockAdjustmentsDomainModule {}
