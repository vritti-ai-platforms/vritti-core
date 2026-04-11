import { Module } from '@nestjs/common';
import { InventoryLevelsDomainModule } from '@domain/inventory-levels/inventory-levels.module';
import { StockAdjustmentsRepository } from './repositories/stock-adjustments.repository';
import { StockAdjustmentsService } from './services/stock-adjustments.service';

@Module({
  imports: [InventoryLevelsDomainModule],
  providers: [StockAdjustmentsService, StockAdjustmentsRepository],
  exports: [StockAdjustmentsService, StockAdjustmentsRepository],
})
export class StockAdjustmentsDomainModule {}
