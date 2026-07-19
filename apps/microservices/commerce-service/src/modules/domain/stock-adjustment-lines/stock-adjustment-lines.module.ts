import { Module } from '@nestjs/common';
import { StockAdjustmentLinesDomainRepository } from './repositories/stock-adjustment-lines.repository';
import { StockAdjustmentLinesDomainService } from './services/stock-adjustment-lines.service';

@Module({
  providers: [StockAdjustmentLinesDomainService, StockAdjustmentLinesDomainRepository],
  exports: [StockAdjustmentLinesDomainService, StockAdjustmentLinesDomainRepository],
})
export class StockAdjustmentLinesDomainModule {}
