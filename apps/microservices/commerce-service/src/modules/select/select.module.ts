import { CatalogsDomainModule } from '@domain/catalogs/catalogs.module';
import { CategoriesDomainModule } from '@domain/categories/categories.module';
import { CostCategoriesDomainModule } from '@domain/cost-categories/cost-categories.module';
import { CustomersDomainModule } from '@domain/customers/customers.module';
import { InventoryItemLotsDomainModule } from '@domain/inventory-item-lots/inventory-item-lots.module';
import { InventoryItemQuantsDomainModule } from '@domain/inventory-item-quants/inventory-item-quants.module';
import { InventoryItemSerialsDomainModule } from '@domain/inventory-item-serials/inventory-item-serials.module';
import { InventoryItemsDomainModule } from '@domain/inventory-items/inventory-items.module';
import { LocationsDomainModule } from '@domain/locations/locations.module';
import { PosTerminalsDomainModule } from '@domain/pos-terminals/pos-terminals.module';
import { PurchaseOrderItemsDomainModule } from '@domain/purchase-order-items/purchase-order-items.module';
import { PurchaseOrdersDomainModule } from '@domain/purchase-orders/purchase-orders.module';
import { SalesChannelsDomainModule } from '@domain/sales-channels/sales-channels.module';
import { SupplierItemsDomainModule } from '@domain/supplier-items/supplier-items.module';
import { SuppliersDomainModule } from '@domain/suppliers/suppliers.module';
import { TaxGroupsDomainModule } from '@domain/tax-groups/tax-groups.module';
import { UomDimensionsDomainModule } from '@domain/uom-dimensions/uom-dimensions.module';
import { UomDomainModule } from '@domain/uom/uom.module';
import { Module } from '@nestjs/common';
import { SelectController } from './select.controller';

@Module({
  imports: [
    CategoriesDomainModule,
    InventoryItemsDomainModule,
    SalesChannelsDomainModule,
    UomDomainModule,
    UomDimensionsDomainModule,
    CatalogsDomainModule,
    CustomersDomainModule,
    LocationsDomainModule,
    InventoryItemLotsDomainModule,
    InventoryItemQuantsDomainModule,
    InventoryItemSerialsDomainModule,
    PosTerminalsDomainModule,
    PurchaseOrderItemsDomainModule,
    PurchaseOrdersDomainModule,
    CostCategoriesDomainModule,
    SupplierItemsDomainModule,
    SuppliersDomainModule,
    TaxGroupsDomainModule,
  ],
  controllers: [SelectController],
})
export class SelectModule {}
