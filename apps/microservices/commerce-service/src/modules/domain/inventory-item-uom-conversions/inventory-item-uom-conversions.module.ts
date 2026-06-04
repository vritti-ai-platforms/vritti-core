import { Module } from '@nestjs/common';
import { InventoryItemUomConversionsRepository } from './repositories/inventory-item-uom-conversions.repository';
import { InventoryItemUomConversionsService } from './services/inventory-item-uom-conversions.service';

@Module({
  providers: [InventoryItemUomConversionsService, InventoryItemUomConversionsRepository],
  exports: [InventoryItemUomConversionsService, InventoryItemUomConversionsRepository],
})
export class InventoryItemUomConversionsDomainModule {}
