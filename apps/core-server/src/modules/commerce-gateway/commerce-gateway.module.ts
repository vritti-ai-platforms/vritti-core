import { Module } from '@nestjs/common';
import { CommerceGatewayServicesModule } from './commerce-gateway-services.module';
import { CostCategoriesGatewayController } from './le-api/cost-categories/cost-categories-gateway.controller';
import { CostCategoriesResolver } from './le-api/cost-categories/cost-categories-gateway.resolver';
import { SupplierItemsGatewayController } from './le-api/supplier-items/supplier-items-gateway.controller';
import { SuppliersGatewayController } from './le-api/suppliers/suppliers-gateway.controller';
import { TaxGroupsGatewayController } from './le-api/tax-groups/tax-groups-gateway.controller';
import { TaxGroupsResolver } from './le-api/tax-groups/tax-groups-gateway.resolver';
import { CategoriesGatewayController } from './org-api/categories/categories-gateway.controller';
import { CompaniesGatewayController } from './org-api/companies/companies-gateway.controller';
import { InventoryItemsGatewayController as OrgInventoryItemsGatewayController } from './org-api/inventory-items/inventory-items-gateway.controller';
import { PeopleAppController } from './org-api/people/people.app.controller';
import { PeopleGatewayController } from './org-api/people/people-gateway.controller';
import { SalesChannelsGatewayController } from './org-api/sales-channels/sales-channels-gateway.controller';
import { TaxClassesGatewayController } from './org-api/tax-classes/tax-classes-gateway.controller';
import { TaxComponentsGatewayController } from './org-api/tax-components/tax-components-gateway.controller';
import { TaxJurisdictionsGatewayController } from './org-api/tax-jurisdictions/tax-jurisdictions-gateway.controller';
import { UomGatewayController } from './org-api/uom/uom-gateway.controller';
import { UomResolver } from './org-api/uom/uom-gateway.resolver';
import { SelectApiController } from './select-api/select-api.controller';
import { SelectApiResolver } from './select-api/select-api.resolver';
import { CatalogsGatewayController } from './site-api/catalogs/catalogs-gateway.controller';
import { CreditNotesGatewayController } from './site-api/credit-notes/credit-notes-gateway.controller';
import { CustomersGatewayController } from './site-api/customers/customers-gateway.controller';
import { GoodsReceiptsGatewayController } from './site-api/goods-receipts/goods-receipts-gateway.controller';
import { GoodsReceiptsResolver } from './site-api/goods-receipts/goods-receipts-gateway.resolver';
import { InventoryItemQuantsGatewayController } from './site-api/inventory-item-quants/inventory-item-quants-gateway.controller';
import { InventoryItemLedgerResolver } from './site-api/inventory-items/inventory-item-ledger-gateway.resolver';
import { InventoryItemLocationsResolver } from './site-api/inventory-items/inventory-item-locations-gateway.resolver';
import { InventoryItemQuantsFeedResolver } from './site-api/inventory-items/inventory-item-quants-gateway.resolver';
import { InventoryItemStockLevelsResolver } from './site-api/inventory-items/inventory-item-stock-levels-gateway.resolver';
import { InventoryItemSuppliersResolver } from './site-api/inventory-items/inventory-item-suppliers-gateway.resolver';
import { InventoryItemUomConversionsResolver } from './site-api/inventory-items/inventory-item-uom-conversions-gateway.resolver';
import { SiteInventoryItemsGatewayController } from './site-api/inventory-items/inventory-items-gateway.controller';
import { InventoryItemsResolver } from './site-api/inventory-items/inventory-items-gateway.resolver';
import { InvoicesGatewayController } from './site-api/invoices/invoices-gateway.controller';
import { LocationsGatewayController } from './site-api/locations/locations-gateway.controller';
import { OrdersGatewayController } from './site-api/orders/orders-gateway.controller';
import { PaymentsGatewayController } from './site-api/payments/payments-gateway.controller';
import { PosTerminalsGatewayController } from './site-api/pos-terminals/pos-terminals-gateway.controller';
import { PurchaseOrdersGatewayController } from './site-api/purchase-orders/purchase-orders-gateway.controller';
import { StockAdjustmentsGatewayController } from './site-api/stock-adjustments/stock-adjustments-gateway.controller';
import { StockTransfersGatewayController } from './site-api/stock-transfers/stock-transfers-gateway.controller';
import { SiteSuppliersGatewayController } from './site-api/suppliers/site-suppliers-gateway.controller';
import { SiteGroupInventoryItemsGatewayController } from './site-group-api/inventory-items/site-group-inventory-items-gateway.controller';

@Module({
  imports: [CommerceGatewayServicesModule],
  controllers: [
    CategoriesGatewayController,
    InventoryItemQuantsGatewayController,
    CostCategoriesGatewayController,
    CreditNotesGatewayController,
    CustomersGatewayController,
    GoodsReceiptsGatewayController,
    SiteInventoryItemsGatewayController,
    LocationsGatewayController,
    InvoicesGatewayController,
    CatalogsGatewayController,
    SalesChannelsGatewayController,
    OrdersGatewayController,
    PosTerminalsGatewayController,
    PaymentsGatewayController,
    PurchaseOrdersGatewayController,
    StockAdjustmentsGatewayController,
    StockTransfersGatewayController,
    SiteSuppliersGatewayController,
    SuppliersGatewayController,
    SupplierItemsGatewayController,
    OrgInventoryItemsGatewayController,
    SiteGroupInventoryItemsGatewayController,
    PeopleGatewayController,
    PeopleAppController,
    CompaniesGatewayController,
    TaxClassesGatewayController,
    TaxComponentsGatewayController,
    TaxJurisdictionsGatewayController,
    TaxGroupsGatewayController,
    UomGatewayController,
    SelectApiController,
  ],
  providers: [
    // Mobile GraphQL resolvers (MOBILE-only @Require(AuthType.Session); thin forwards to the gateway services above)
    InventoryItemsResolver,
    GoodsReceiptsResolver,
    InventoryItemLedgerResolver,
    InventoryItemLocationsResolver,
    InventoryItemQuantsFeedResolver,
    InventoryItemStockLevelsResolver,
    InventoryItemSuppliersResolver,
    InventoryItemUomConversionsResolver,
    UomResolver,
    TaxGroupsResolver,
    CostCategoriesResolver,
    SelectApiResolver,
  ],
})
export class CommerceGatewayModule {}
