import { SiteDomainModule } from '@domain/site/site.module';
import { Module } from '@nestjs/common';
import { CostCategoriesGatewayService } from './le-api/cost-categories/services/cost-categories-gateway.service';
import { SupplierItemsGatewayService } from './le-api/supplier-items/services/supplier-items-gateway.service';
import { SuppliersGatewayService } from './le-api/suppliers/services/suppliers-gateway.service';
import { TaxGroupsGatewayService } from './le-api/tax-groups/services/tax-groups-gateway.service';
import { CategoriesGatewayService } from './org-api/categories/services/categories-gateway.service';
import { CompaniesGatewayService } from './org-api/companies/services/companies-gateway.service';
import { InventoryItemsGatewayService as OrgInventoryItemsGatewayService } from './org-api/inventory-items/services/inventory-items-gateway.service';
import { PeopleGatewayService } from './org-api/people/services/people-gateway.service';
import { SalesChannelsGatewayService } from './org-api/sales-channels/services/sales-channels-gateway.service';
import { TaxClassesGatewayService } from './org-api/tax-classes/services/tax-classes-gateway.service';
import { TaxComponentsGatewayService } from './org-api/tax-components/services/tax-components-gateway.service';
import { TaxJurisdictionsGatewayService } from './org-api/tax-jurisdictions/services/tax-jurisdictions-gateway.service';
import { UomGatewayService } from './org-api/uom/services/uom-gateway.service';
import { CatalogsGatewayService } from './site-api/catalogs/services/catalogs-gateway.service';
import { CreditNotesGatewayService } from './site-api/credit-notes/services/credit-notes-gateway.service';
import { CustomersGatewayService } from './site-api/customers/services/customers-gateway.service';
import { GoodsReceiptsGatewayService } from './site-api/goods-receipts/services/goods-receipts-gateway.service';
import { InventoryItemQuantsGatewayService } from './site-api/inventory-item-quants/services/inventory-item-quants-gateway.service';
import { SiteInventoryItemsGatewayService } from './site-api/inventory-items/services/inventory-items-gateway.service';
import { InvoicesGatewayService } from './site-api/invoices/services/invoices-gateway.service';
import { LocationsGatewayService } from './site-api/locations/services/locations-gateway.service';
import { OrdersGatewayService } from './site-api/orders/services/orders-gateway.service';
import { PaymentsGatewayService } from './site-api/payments/services/payments-gateway.service';
import { PosTerminalsGatewayService } from './site-api/pos-terminals/services/pos-terminals-gateway.service';
import { PurchaseOrdersGatewayService } from './site-api/purchase-orders/services/purchase-orders-gateway.service';
import { StockAdjustmentsGatewayService } from './site-api/stock-adjustments/services/stock-adjustments-gateway.service';
import { StockTransfersGatewayService } from './site-api/stock-transfers/services/stock-transfers-gateway.service';
import { SiteSuppliersGatewayService } from './site-api/suppliers/services/site-suppliers-gateway.service';
import { SiteGroupInventoryItemsGatewayService } from './site-group-api/inventory-items/services/site-group-inventory-items-gateway.service';

const services = [
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
];

/**
 * Every commerce gateway service, and nothing else.
 *
 * Services sit apart from the surfaces that use them because BOTH surface modules need them and
 * neither may import the other: `GraphQLModule`'s `include` walks imports transitively, so a
 * surface importing another surface would pull that surface's resolvers into its schema.
 *
 * Holding the services here keeps each surface's closure resolver-free while giving every service
 * exactly one instance — which re-providing per surface would not.
 */
@Module({
  // Three gateway services inject SiteDomainService / SiteDomainRepository, so the domain module
  // must be imported HERE, where those services are provided.
  imports: [SiteDomainModule],
  providers: services,
  exports: services,
})
export class CommerceGatewayServicesModule {}
