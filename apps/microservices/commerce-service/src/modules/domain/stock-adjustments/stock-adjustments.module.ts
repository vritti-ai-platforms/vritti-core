import { Module } from '@nestjs/common';
import { StockAdjustmentsRepository } from './repositories/stock-adjustments.repository';
import { StockAdjustmentsService } from './services/stock-adjustments.service';

@Module({
  providers: [StockAdjustmentsService, StockAdjustmentsRepository],
  exports: [StockAdjustmentsService, StockAdjustmentsRepository],
})
export class StockAdjustmentsDomainModule {}
