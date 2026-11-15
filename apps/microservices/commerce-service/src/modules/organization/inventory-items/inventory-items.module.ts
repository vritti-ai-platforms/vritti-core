import { CategoriesDomainModule } from '@domain/categories/categories.module';
import { InventoryItemMrpsDomainModule } from '@domain/inventory-item-mrps/inventory-item-mrps.module';
import { InventoryItemStorageTypesDomainModule } from '@domain/inventory-item-storage-types/inventory-item-storage-types.module';
import { InventoryItemUomConversionsDomainModule } from '@domain/inventory-item-uom-conversions/inventory-item-uom-conversions.module';
import { InventoryItemsDomainModule } from '@domain/inventory-items/inventory-items.module';
import { OfferingBomDomainModule } from '@domain/offering-bom/offering-bom.module';
import { OfferingVariantsDomainModule } from '@domain/offering-variants/offering-variants.module';
import { OfferingsDomainModule } from '@domain/offerings/offerings.module';
import { StorageTypesDomainModule } from '@domain/storage-types/storage-types.module';
import { SupplierItemsDomainModule } from '@domain/supplier-items/supplier-items.module';
import { UomDomainModule } from '@domain/uom/uom.module';
import { Module } from '@nestjs/common';
import { InventoryItemsMrpController } from './mrp/inventory-items-mrp.controller';
import { InventoryItemsMrpService } from './mrp/services/inventory-items-mrp.service';
import { InventoryItemsRootController } from './root/inventory-items-root.controller';
import { OrgInventoryItemsService } from './root/services/inventory-items-root.service';
import { InventoryItemsStorageTypesController } from './storage-types/inventory-items-storage-types.controller';
import { InventoryItemsStorageTypesService } from './storage-types/services/inventory-items-storage-types.service';
import { InventoryItemsSuppliersController } from './suppliers/inventory-items-suppliers.controller';
import { InventoryItemsUomConversionsController } from './uom-conversions/inventory-items-uom-conversions.controller';
import { InventoryItemsUomConversionsService } from './uom-conversions/services/inventory-items-uom-conversions.service';

@Module({
  imports: [
    InventoryItemsDomainModule,
    InventoryItemUomConversionsDomainModule,
    InventoryItemMrpsDomainModule,
    SupplierItemsDomainModule,
    CategoriesDomainModule,
    UomDomainModule,
    OfferingsDomainModule,
    OfferingVariantsDomainModule,
    OfferingBomDomainModule,
    StorageTypesDomainModule,
    InventoryItemStorageTypesDomainModule,
  ],
  controllers: [
    InventoryItemsRootController,
    InventoryItemsUomConversionsController,
    InventoryItemsMrpController,
    InventoryItemsSuppliersController,
    InventoryItemsStorageTypesController,
  ],
  providers: [
    OrgInventoryItemsService,
    InventoryItemsMrpService,
    InventoryItemsUomConversionsService,
    InventoryItemsStorageTypesService,
  ],
})
export class OrgInventoryItemsModule {}
