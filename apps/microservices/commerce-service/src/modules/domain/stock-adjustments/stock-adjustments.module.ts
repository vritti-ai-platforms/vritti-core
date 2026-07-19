import { Module } from '@nestjs/common';
import { StockAdjustmentsDomainRepository } from './repositories/stock-adjustments.repository';
import { StockAdjustmentsDomainService } from './services/stock-adjustments.service';

@Module({
  providers: [StockAdjustmentsDomainService, StockAdjustmentsDomainRepository],
  exports: [StockAdjustmentsDomainService, StockAdjustmentsDomainRepository],
})
export class StockAdjustmentsDomainModule {}
