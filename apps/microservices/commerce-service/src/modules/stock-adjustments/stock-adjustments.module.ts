import { StockAdjustmentsDomainModule } from '@domain/stock-adjustments/stock-adjustments.module';
import { Module } from '@nestjs/common';
import { StockAdjustmentsController } from './stock-adjustments.controller';

@Module({
  imports: [StockAdjustmentsDomainModule],
  controllers: [StockAdjustmentsController],
})
export class StockAdjustmentsModule {}
