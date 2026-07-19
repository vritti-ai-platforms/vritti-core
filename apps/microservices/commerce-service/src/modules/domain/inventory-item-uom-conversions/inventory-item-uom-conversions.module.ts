import { Module } from '@nestjs/common';
import { InventoryItemUomConversionsDomainRepository } from './repositories/inventory-item-uom-conversions.repository';
import { InventoryItemUomConversionsDomainService } from './services/inventory-item-uom-conversions.service';

@Module({
  providers: [InventoryItemUomConversionsDomainService, InventoryItemUomConversionsDomainRepository],
  exports: [InventoryItemUomConversionsDomainService, InventoryItemUomConversionsDomainRepository],
})
export class InventoryItemUomConversionsDomainModule {}
