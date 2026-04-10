import { InventoryItemsDomainModule } from '@domain/inventory-items/inventory-items.module';
import { Module } from '@nestjs/common';
import { InventoryItemsController } from './inventory-items.controller';

@Module({
  imports: [InventoryItemsDomainModule],
  controllers: [InventoryItemsController],
})
export class InventoryItemsModule {}
