import { InventoryItemMrpsDomainModule } from '@domain/inventory-item-mrps/inventory-item-mrps.module';
import { InventoryItemsDomainModule } from '@domain/inventory-items/inventory-items.module';
import { SupplierItemPricesDomainModule } from '@domain/supplier-item-prices/supplier-item-prices.module';
import { SupplierItemsDomainModule } from '@domain/supplier-items/supplier-items.module';
import { SuppliersDomainModule } from '@domain/suppliers/suppliers.module';
import { UomConversionsDomainModule } from '@domain/uom-conversions/uom-conversions.module';
import { Module } from '@nestjs/common';
import { LeInventoryItemPricesController } from './prices/inventory-item-prices.controller';
import { LeInventoryItemPricesService } from './prices/services/inventory-item-prices.service';
import { LeInventoryItemsController } from './root/inventory-items-root.controller';

@Module({
  imports: [
    InventoryItemsDomainModule,
    SupplierItemsDomainModule,
    SupplierItemPricesDomainModule,
    InventoryItemMrpsDomainModule,
    UomConversionsDomainModule,
    SuppliersDomainModule,
  ],
  controllers: [LeInventoryItemsController, LeInventoryItemPricesController],
  providers: [LeInventoryItemPricesService],
})
export class LeInventoryItemsModule {}
