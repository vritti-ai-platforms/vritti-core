import { Module } from '@nestjs/common';
import { StockAdjustmentLotsDomainRepository } from './repositories/stock-adjustment-lots.repository';
import { StockAdjustmentLotsDomainService } from './services/stock-adjustment-lots.service';

@Module({
  providers: [StockAdjustmentLotsDomainService, StockAdjustmentLotsDomainRepository],
  exports: [StockAdjustmentLotsDomainService, StockAdjustmentLotsDomainRepository],
})
export class StockAdjustmentLotsDomainModule {}
