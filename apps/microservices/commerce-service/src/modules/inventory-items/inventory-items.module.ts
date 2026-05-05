import { InventoryItemsDomainModule } from '@domain/inventory-items/inventory-items.module';
import { Module } from '@nestjs/common';
import { InventoryItemsController } from './inventory-items.controller';
import { InventoryItemUomConversionsModule } from './uom-conversions/inventory-item-uom-conversions.module';

@Module({
  imports: [InventoryItemsDomainModule, InventoryItemUomConversionsModule],
  controllers: [InventoryItemsController],
})
export class InventoryItemsModule {}
