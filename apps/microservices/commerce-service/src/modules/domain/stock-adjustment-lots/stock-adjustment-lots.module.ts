import { Module } from '@nestjs/common';
import { StockAdjustmentLotsRepository } from './repositories/stock-adjustment-lots.repository';
import { StockAdjustmentLotsService } from './services/stock-adjustment-lots.service';

@Module({
  providers: [StockAdjustmentLotsService, StockAdjustmentLotsRepository],
  exports: [StockAdjustmentLotsService, StockAdjustmentLotsRepository],
})
export class StockAdjustmentLotsDomainModule {}
