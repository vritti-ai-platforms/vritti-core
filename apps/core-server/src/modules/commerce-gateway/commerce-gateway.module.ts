import { Module } from '@nestjs/common';
import { BusinessUnitDomainModule } from '@/modules/domain/business-unit/business-unit.module';
import { UserDomainModule } from '@/modules/domain/user/user.module';
import { CatalogsGatewayController } from './catalogs/catalogs-gateway.controller';
import { CatalogsGatewayService } from './catalogs/services/catalogs-gateway.service';
import { CategoriesGatewayController } from './categories/categories-gateway.controller';
import { CategoriesResolver } from './categories/resolvers/categories.resolver';
import { CategoriesGatewayService } from './categories/services/categories-gateway.service';
import { CostCategoriesGatewayController } from './cost-categories/cost-categories-gateway.controller';
import { CostCategoriesGatewayService } from './cost-categories/services/cost-categories-gateway.service';
import { CreditNotesGatewayController } from './credit-notes/credit-notes-gateway.controller';
import { CreditNotesGatewayService } from './credit-notes/services/credit-notes-gateway.service';
import { CustomersGatewayController } from './customers/customers-gateway.controller';
import { CustomersGatewayService } from './customers/services/customers-gateway.service';
import { GoodsReceiptsGatewayController } from './goods-receipts/goods-receipts-gateway.controller';
import { GoodsReceiptsGatewayService } from './goods-receipts/services/goods-receipts-gateway.service';
import { InventoryItemLotsGatewayController } from './inventory-item-lots/inventory-item-lots-gateway.controller';
import { InventoryItemLotsGatewayService } from './inventory-item-lots/services/inventory-item-lots-gateway.service';
import { InventoryItemQuantsGatewayController } from './inventory-item-quants/inventory-item-quants-gateway.controller';
import { InventoryItemQuantsGatewayService } from './inventory-item-quants/services/inventory-item-quants-gateway.service';
import { InventoryItemSerialsGatewayController } from './inventory-item-serials/inventory-item-serials-gateway.controller';
import { InventoryItemSerialsGatewayService } from './inventory-item-serials/services/inventory-item-serials-gateway.service';
import { InventoryItemsGatewayController } from './inventory-items/inventory-items-gateway.controller';
import { InventoryItemsResolver } from './inventory-items/resolvers/inventory-items.resolver';
import { InventoryItemsGatewayService } from './inventory-items/services/inventory-items-gateway.service';
import { InvoicesGatewayController } from './invoices/invoices-gateway.controller';
import { InvoicesGatewayService } from './invoices/services/invoices-gateway.service';
import { LocationsGatewayController } from './locations/locations-gateway.controller';
import { LocationsGatewayService } from './locations/services/locations-gateway.service';
import { OrdersGatewayController } from './orders/orders-gateway.controller';
import { OrdersGatewayService } from './orders/services/orders-gateway.service';
import { PaymentsGatewayController } from './payments/payments-gateway.controller';
import { PaymentsGatewayService } from './payments/services/payments-gateway.service';
import { PosTerminalsGatewayController } from './pos-terminals/pos-terminals-gateway.controller';
import { PosTerminalsGatewayService } from './pos-terminals/services/pos-terminals-gateway.service';
import { PurchaseOrderItemsGatewayController } from './purchase-order-items/purchase-order-items-gateway.controller';
import { PurchaseOrderItemsGatewayService } from './purchase-order-items/services/purchase-order-items-gateway.service';
import { PurchaseOrdersGatewayController } from './purchase-orders/purchase-orders-gateway.controller';
import { PurchaseOrdersGatewayService } from './purchase-orders/services/purchase-orders-gateway.service';
import { SalesChannelsGatewayController } from './sales-channels/sales-channels-gateway.controller';
import { SalesChannelsGatewayService } from './sales-channels/services/sales-channels-gateway.service';
import { StockAdjustmentsGatewayService } from './stock-adjustments/services/stock-adjustments-gateway.service';
import { StockAdjustmentsGatewayController } from './stock-adjustments/stock-adjustments-gateway.controller';
import { StockTransfersGatewayService } from './stock-transfers/services/stock-transfers-gateway.service';
import { StockTransfersGatewayController } from './stock-transfers/stock-transfers-gateway.controller';
import { SupplierItemsGatewayService } from './supplier-items/services/supplier-items-gateway.service';
import { SupplierItemsGatewayController } from './supplier-items/supplier-items-gateway.controller';
import { SuppliersGatewayService } from './suppliers/services/suppliers-gateway.service';
import { SuppliersGatewayController } from './suppliers/suppliers-gateway.controller';
import { TaxGroupsGatewayService } from './tax-groups/services/tax-groups-gateway.service';
import { TaxGroupsGatewayController } from './tax-groups/tax-groups-gateway.controller';
import { UomGatewayService } from './uom/services/uom-gateway.service';
import { UomGatewayController } from './uom/uom-gateway.controller';
import { UomDimensionsGatewayService } from './uom-dimensions/services/uom-dimensions-gateway.service';
import { UomDimensionsGatewayController } from './uom-dimensions/uom-dimensions-gateway.controller';
// Select options resolvers (Select→Apollo migration) — thin GraphQL forwards to each gateway `.select()`.
import { CostCategoriesResolver } from './cost-categories/resolvers/cost-categories.resolver';
import { CustomersResolver } from './customers/resolvers/customers.resolver';
import { InventoryItemLotsResolver } from './inventory-item-lots/resolvers/inventory-item-lots.resolver';
import { InventoryItemQuantsResolver } from './inventory-item-quants/resolvers/inventory-item-quants.resolver';
import { InventoryItemSerialsResolver } from './inventory-item-serials/resolvers/inventory-item-serials.resolver';
import { LocationsResolver } from './locations/resolvers/locations.resolver';
import { PurchaseOrderItemsResolver } from './purchase-order-items/resolvers/purchase-order-items.resolver';
import { PurchaseOrdersResolver } from './purchase-orders/resolvers/purchase-orders.resolver';
import { SupplierItemsResolver } from './supplier-items/resolvers/supplier-items.resolver';
import { SuppliersResolver } from './suppliers/resolvers/suppliers.resolver';
import { TaxGroupsResolver } from './tax-groups/resolvers/tax-groups.resolver';
import { UomResolver } from './uom/resolvers/uom.resolver';

@Module({
  imports: [BusinessUnitDomainModule, UserDomainModule],
  controllers: [
    CategoriesGatewayController,
    InventoryItemLotsGatewayController,
    InventoryItemSerialsGatewayController,
    InventoryItemQuantsGatewayController,
    CostCategoriesGatewayController,
    CreditNotesGatewayController,
    CustomersGatewayController,
    GoodsReceiptsGatewayController,
    InventoryItemsGatewayController,
    LocationsGatewayController,
    InvoicesGatewayController,
    CatalogsGatewayController,
    SalesChannelsGatewayController,
    OrdersGatewayController,
    PosTerminalsGatewayController,
    PaymentsGatewayController,
    PurchaseOrderItemsGatewayController,
    PurchaseOrdersGatewayController,
    StockAdjustmentsGatewayController,
    StockTransfersGatewayController,
    SupplierItemsGatewayController,
    SuppliersGatewayController,
    TaxGroupsGatewayController,
    UomGatewayController,
    UomDimensionsGatewayController,
  ],
  providers: [
    CategoriesGatewayService,
    CategoriesResolver,
    InventoryItemLotsGatewayService,
    InventoryItemSerialsGatewayService,
    InventoryItemQuantsGatewayService,
    CostCategoriesGatewayService,
    CreditNotesGatewayService,
    CustomersGatewayService,
    GoodsReceiptsGatewayService,
    InventoryItemsGatewayService,
    InventoryItemsResolver,
    LocationsGatewayService,
    InvoicesGatewayService,
    CatalogsGatewayService,
    SalesChannelsGatewayService,
    OrdersGatewayService,
    PosTerminalsGatewayService,
    PaymentsGatewayService,
    PurchaseOrderItemsGatewayService,
    PurchaseOrdersGatewayService,
    StockAdjustmentsGatewayService,
    StockTransfersGatewayService,
    SupplierItemsGatewayService,
    SuppliersGatewayService,
    TaxGroupsGatewayService,
    UomGatewayService,
    UomDimensionsGatewayService,
    // Select options resolvers
    CostCategoriesResolver,
    CustomersResolver,
    InventoryItemLotsResolver,
    InventoryItemQuantsResolver,
    InventoryItemSerialsResolver,
    LocationsResolver,
    PurchaseOrderItemsResolver,
    PurchaseOrdersResolver,
    SupplierItemsResolver,
    SuppliersResolver,
    TaxGroupsResolver,
    UomResolver,
  ],
})
export class CommerceGatewayModule {}
