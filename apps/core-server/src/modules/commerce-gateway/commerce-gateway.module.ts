import { Module } from '@nestjs/common';
import { SiteDomainModule } from '@/modules/domain/site/site.module';
import { UserDomainModule } from '@/modules/domain/user/user.module';
import { CostCategoriesGatewayController } from './le-api/cost-categories/cost-categories-gateway.controller';
import { CostCategoriesResolver } from './le-api/cost-categories/cost-categories-gateway.resolver';
import { CostCategoriesGatewayService } from './le-api/cost-categories/services/cost-categories-gateway.service';
import { SupplierItemsGatewayService } from './le-api/supplier-items/services/supplier-items-gateway.service';
import { SupplierItemsGatewayController } from './le-api/supplier-items/supplier-items-gateway.controller';
import { SuppliersGatewayService } from './le-api/suppliers/services/suppliers-gateway.service';
import { SuppliersGatewayController } from './le-api/suppliers/suppliers-gateway.controller';
import { TaxGroupsGatewayService } from './le-api/tax-groups/services/tax-groups-gateway.service';
import { TaxGroupsGatewayController } from './le-api/tax-groups/tax-groups-gateway.controller';
import { TaxGroupsResolver } from './le-api/tax-groups/tax-groups-gateway.resolver';
import { CategoriesGatewayController } from './org-api/categories/categories-gateway.controller';
import { CategoriesGatewayService } from './org-api/categories/services/categories-gateway.service';
import { CompaniesGatewayController } from './org-api/companies/companies-gateway.controller';
import { CompaniesGatewayService } from './org-api/companies/services/companies-gateway.service';
import { InventoryItemsGatewayController as OrgInventoryItemsGatewayController } from './org-api/inventory-items/inventory-items-gateway.controller';
import { InventoryItemsGatewayService as OrgInventoryItemsGatewayService } from './org-api/inventory-items/services/inventory-items-gateway.service';
import { PeopleAppController } from './org-api/people/people.app.controller';
import { PeopleAppResolver } from './org-api/people/people.app.resolver';
import { PeopleGatewayController } from './org-api/people/people-gateway.controller';
import { PeopleGatewayService } from './org-api/people/services/people-gateway.service';
import { SalesChannelsGatewayController } from './org-api/sales-channels/sales-channels-gateway.controller';
import { SalesChannelsGatewayService } from './org-api/sales-channels/services/sales-channels-gateway.service';
import { TaxClassesGatewayService } from './org-api/tax-classes/services/tax-classes-gateway.service';
import { TaxClassesGatewayController } from './org-api/tax-classes/tax-classes-gateway.controller';
import { TaxComponentsGatewayService } from './org-api/tax-components/services/tax-components-gateway.service';
import { TaxComponentsGatewayController } from './org-api/tax-components/tax-components-gateway.controller';
import { TaxJurisdictionsGatewayService } from './org-api/tax-jurisdictions/services/tax-jurisdictions-gateway.service';
import { TaxJurisdictionsGatewayController } from './org-api/tax-jurisdictions/tax-jurisdictions-gateway.controller';
import { UomGatewayService } from './org-api/uom/services/uom-gateway.service';
import { UomGatewayController } from './org-api/uom/uom-gateway.controller';
import { UomResolver } from './org-api/uom/uom-gateway.resolver';
import { SelectApiController } from './select-api/select-api.controller';
import { SelectApiResolver } from './select-api/select-api.resolver';
import { CatalogsGatewayController } from './site-api/catalogs/catalogs-gateway.controller';
import { CatalogsGatewayService } from './site-api/catalogs/services/catalogs-gateway.service';
import { CreditNotesGatewayController } from './site-api/credit-notes/credit-notes-gateway.controller';
import { CreditNotesGatewayService } from './site-api/credit-notes/services/credit-notes-gateway.service';
import { CustomersGatewayController } from './site-api/customers/customers-gateway.controller';
import { CustomersGatewayService } from './site-api/customers/services/customers-gateway.service';
import { GoodsReceiptsGatewayController } from './site-api/goods-receipts/goods-receipts-gateway.controller';
import { GoodsReceiptsResolver } from './site-api/goods-receipts/goods-receipts-gateway.resolver';
import { GoodsReceiptsGatewayService } from './site-api/goods-receipts/services/goods-receipts-gateway.service';
import { InventoryItemQuantsGatewayController } from './site-api/inventory-item-quants/inventory-item-quants-gateway.controller';
import { InventoryItemQuantsGatewayService } from './site-api/inventory-item-quants/services/inventory-item-quants-gateway.service';
import { InventoryItemLedgerResolver } from './site-api/inventory-items/inventory-item-ledger-gateway.resolver';
import { InventoryItemLocationsResolver } from './site-api/inventory-items/inventory-item-locations-gateway.resolver';
import { InventoryItemQuantsFeedResolver } from './site-api/inventory-items/inventory-item-quants-gateway.resolver';
import { InventoryItemStockLevelsResolver } from './site-api/inventory-items/inventory-item-stock-levels-gateway.resolver';
import { InventoryItemSuppliersResolver } from './site-api/inventory-items/inventory-item-suppliers-gateway.resolver';
import { InventoryItemUomConversionsResolver } from './site-api/inventory-items/inventory-item-uom-conversions-gateway.resolver';
import { SiteInventoryItemsGatewayController } from './site-api/inventory-items/inventory-items-gateway.controller';
import { InventoryItemsResolver } from './site-api/inventory-items/inventory-items-gateway.resolver';
import { SiteInventoryItemsGatewayService } from './site-api/inventory-items/services/inventory-items-gateway.service';
import { InvoicesGatewayController } from './site-api/invoices/invoices-gateway.controller';
import { InvoicesGatewayService } from './site-api/invoices/services/invoices-gateway.service';
import { LocationsGatewayController } from './site-api/locations/locations-gateway.controller';
import { LocationsGatewayService } from './site-api/locations/services/locations-gateway.service';
import { OrdersGatewayController } from './site-api/orders/orders-gateway.controller';
import { OrdersGatewayService } from './site-api/orders/services/orders-gateway.service';
import { PaymentsGatewayController } from './site-api/payments/payments-gateway.controller';
import { PaymentsGatewayService } from './site-api/payments/services/payments-gateway.service';
import { PosTerminalsGatewayController } from './site-api/pos-terminals/pos-terminals-gateway.controller';
import { PosTerminalsGatewayService } from './site-api/pos-terminals/services/pos-terminals-gateway.service';
import { PurchaseOrdersGatewayController } from './site-api/purchase-orders/purchase-orders-gateway.controller';
import { PurchaseOrdersGatewayService } from './site-api/purchase-orders/services/purchase-orders-gateway.service';
import { StockAdjustmentsGatewayService } from './site-api/stock-adjustments/services/stock-adjustments-gateway.service';
import { StockAdjustmentsGatewayController } from './site-api/stock-adjustments/stock-adjustments-gateway.controller';
import { StockTransfersGatewayService } from './site-api/stock-transfers/services/stock-transfers-gateway.service';
import { StockTransfersGatewayController } from './site-api/stock-transfers/stock-transfers-gateway.controller';
import { SiteSuppliersGatewayService } from './site-api/suppliers/services/site-suppliers-gateway.service';
import { SiteSuppliersGatewayController } from './site-api/suppliers/site-suppliers-gateway.controller';
import { SiteGroupInventoryItemsGatewayService } from './site-group-api/inventory-items/services/site-group-inventory-items-gateway.service';
import { SiteGroupInventoryItemsGatewayController } from './site-group-api/inventory-items/site-group-inventory-items-gateway.controller';

@Module({
  imports: [SiteDomainModule, UserDomainModule],
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
    CategoriesGatewayService,
    InventoryItemQuantsGatewayService,
    CostCategoriesGatewayService,
    CreditNotesGatewayService,
    CustomersGatewayService,
    GoodsReceiptsGatewayService,
    SiteInventoryItemsGatewayService,
    LocationsGatewayService,
    InvoicesGatewayService,
    CatalogsGatewayService,
    SalesChannelsGatewayService,
    OrdersGatewayService,
    PosTerminalsGatewayService,
    PaymentsGatewayService,
    PurchaseOrdersGatewayService,
    StockAdjustmentsGatewayService,
    StockTransfersGatewayService,
    SiteSuppliersGatewayService,
    SuppliersGatewayService,
    SupplierItemsGatewayService,
    OrgInventoryItemsGatewayService,
    SiteGroupInventoryItemsGatewayService,
    PeopleGatewayService,
    CompaniesGatewayService,
    TaxClassesGatewayService,
    TaxComponentsGatewayService,
    TaxJurisdictionsGatewayService,
    TaxGroupsGatewayService,
    UomGatewayService,
    // Mobile GraphQL resolvers (MOBILE-only @RequireSession; thin forwards to the gateway services above)
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
    PeopleAppResolver,
  ],
})
export class CommerceGatewayModule {}
