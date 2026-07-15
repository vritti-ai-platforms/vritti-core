import { CategoriesDomainModule } from '@domain/categories/categories.module';
import { InventoryItemMrpsDomainModule } from '@domain/inventory-item-mrps/inventory-item-mrps.module';
import { InventoryItemUomConversionsDomainModule } from '@domain/inventory-item-uom-conversions/inventory-item-uom-conversions.module';
import { InventoryItemsDomainModule } from '@domain/inventory-items/inventory-items.module';
import { SupplierItemsDomainModule } from '@domain/supplier-items/supplier-items.module';
import { UomDomainModule } from '@domain/uom/uom.module';
import { Module } from '@nestjs/common';
import { InventoryItemsMrpController } from './mrp/inventory-items-mrp.controller';
import { InventoryItemsMrpService } from './mrp/services/inventory-items-mrp.service';
import { InventoryItemsRootController } from './root/inventory-items-root.controller';
import { InventoryItemsRootService } from './root/services/inventory-items-root.service';
import { InventoryItemsSuppliersController } from './suppliers/inventory-items-suppliers.controller';
import { InventoryItemsUomConversionsController } from './uom-conversions/inventory-items-uom-conversions.controller';

@Module({
  imports: [
    InventoryItemsDomainModule,
    InventoryItemUomConversionsDomainModule,
    InventoryItemMrpsDomainModule,
    SupplierItemsDomainModule,
    CategoriesDomainModule,
    UomDomainModule,
  ],
  controllers: [
    InventoryItemsRootController,
    InventoryItemsUomConversionsController,
    InventoryItemsMrpController,
    InventoryItemsSuppliersController,
  ],
  providers: [InventoryItemsRootService, InventoryItemsMrpService],
})
export class OrgInventoryItemsModule {}
