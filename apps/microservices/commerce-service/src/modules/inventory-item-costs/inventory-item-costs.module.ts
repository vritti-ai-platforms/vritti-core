import { InventoryItemCostsDomainModule } from '@domain/inventory-item-costs/inventory-item-costs.module';
import { Module } from '@nestjs/common';
import { InventoryItemCostsController } from './inventory-item-costs.controller';

@Module({
  imports: [InventoryItemCostsDomainModule],
  controllers: [InventoryItemCostsController],
})
export class InventoryItemCostsModule {}
