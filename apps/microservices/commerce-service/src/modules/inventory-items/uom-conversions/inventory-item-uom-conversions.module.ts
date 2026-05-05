import { InventoryItemUomConversionsDomainModule } from '@domain/inventory-item-uom-conversions/inventory-item-uom-conversions.module';
import { Module } from '@nestjs/common';
import { InventoryItemUomConversionsController } from './inventory-item-uom-conversions.controller';

@Module({
  imports: [InventoryItemUomConversionsDomainModule],
  controllers: [InventoryItemUomConversionsController],
})
export class InventoryItemUomConversionsModule {}
