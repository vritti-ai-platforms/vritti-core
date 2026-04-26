import { InventoryItemLotsDomainModule } from '@domain/inventory-item-lots/inventory-item-lots.module';
import { Module } from '@nestjs/common';
import { InventoryItemLotsController } from './inventory-item-lots.controller';

@Module({
  imports: [InventoryItemLotsDomainModule],
  controllers: [InventoryItemLotsController],
})
export class InventoryItemLotsModule {}
