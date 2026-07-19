import { Module } from '@nestjs/common';
import { StockAdjustmentLineItemsDomainRepository } from './repositories/stock-adjustment-line-items.repository';
import { StockAdjustmentLineItemsDomainService } from './services/stock-adjustment-line-items.service';

@Module({
  providers: [StockAdjustmentLineItemsDomainService, StockAdjustmentLineItemsDomainRepository],
  exports: [StockAdjustmentLineItemsDomainService, StockAdjustmentLineItemsDomainRepository],
})
export class StockAdjustmentLineItemsDomainModule {}
