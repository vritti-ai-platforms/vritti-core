import { InventoryItemQuantItemsDomainModule } from '@domain/inventory-item-quant-items/inventory-item-quant-items.module';
import { Module } from '@nestjs/common';
import { InventoryItemQuantItemsController } from './inventory-item-quant-items.controller';

@Module({
  imports: [InventoryItemQuantItemsDomainModule],
  controllers: [InventoryItemQuantItemsController],
})
export class InventoryItemQuantItemsModule {}
