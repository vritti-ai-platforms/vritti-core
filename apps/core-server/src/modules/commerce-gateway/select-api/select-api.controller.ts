import { CategoriesSelectQueryDto } from '@commerce/categories/dto/request/categories-select-query.dto';
import { ReceivablePurchaseOrdersSelectQueryDto } from '@commerce/goods-receipts/dto/request/receivable-purchase-orders-select-query.dto';
import { DeliverablePurchaseOrderItemsSelectQueryDto } from '@commerce/inbound-deliveries/dto/request/deliverable-purchase-order-items-select-query.dto';
import { LotsSelectQueryDto } from '@commerce/inventory-item-lots/dto/request/lots-select-query.dto';
import { QuantsSelectQueryDto } from '@commerce/inventory-item-quants/dto/request/quants-select-query.dto';
import { SerialsSelectQueryDto } from '@commerce/inventory-item-serials/dto/request/serials-select-query.dto';
import { InventoryItemsSelectQueryDto } from '@commerce/inventory-items/dto/request/inventory-items-select-query.dto';
import { LocationsSelectQueryDto } from '@commerce/locations/dto/request/locations-select-query.dto';
import { PartyCommunicationSelectQueryDto } from '@commerce/parties/dto/request/party-communication-select-query.dto';
import { PartyContactSelectQueryDto } from '@commerce/parties/dto/request/party-contact-select-query.dto';
import { PartySelectQueryDto } from '@commerce/parties/dto/request/party-select-query.dto';
import { PartyTaxRegistrationSelectQueryDto } from '@commerce/parties/dto/request/party-tax-registration-select-query.dto';
import { PaymentTermsSelectQueryDto } from '@commerce/payment-terms/dto/request/payment-terms-select-query.dto';
import { PurchaseOrderItemsSelectQueryDto } from '@commerce/purchase-orders/dto/request/purchase-order-items-select-query.dto';
import { PurchaseOrderSelectQueryDto } from '@commerce/purchase-orders/dto/request/purchase-order-select-query.dto';
import { SupplierEnrollmentSelectQueryDto } from '@commerce/supplier-enrollments/dto/request/supplier-enrollment-select-query.dto';
import { SupplierItemsSelectQueryDto } from '@commerce/supplier-items/dto/request/supplier-items-select-query.dto';
import { SuppliersSelectQueryDto } from '@commerce/suppliers/dto/request/suppliers-select-query.dto';
import { TaxComponentsSelectQueryDto } from '@commerce/tax-components/dto/request/tax-components-select-query.dto';
import { TaxGroupsSelectQueryDto } from '@commerce/tax-groups/dto/request/tax-groups-select-query.dto';
import { TaxJurisdictionSelectQueryDto } from '@commerce/tax-jurisdictions/dto/request/tax-jurisdiction-select-query.dto';
import { UomSelectQueryDto } from '@commerce/uom/dto/request/uom-select-query.dto';
import { Controller, Get, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AuthType, Require } from '@vritti/api-sdk/auth';
import { NatsClientService } from '@vritti/api-sdk/nats';
import { SelectOptionsQueryDto, type SelectQueryResult } from '@vritti/api-sdk/select';
import { SessionTypeValues } from '@/db/schema';
import {
  ApiAttributeTemplatesSelect,
  ApiCatalogsSelect,
  ApiCategoriesSelect,
  ApiCostCategoriesSelect,
  ApiCustomersSelect,
  ApiDeliverablePurchaseOrderItemsSelect,
  ApiDimensionTemplatesSelect,
  ApiInventoryItemLotsSelect,
  ApiInventoryItemMrpsSelect,
  ApiInventoryItemQuantsSelect,
  ApiInventoryItemSerialsSelect,
  ApiInventoryItemsSelect,
  ApiLocationsSelect,
  ApiOfferingsSelect,
  ApiOfferingVariantsSelect,
  ApiPaymentTermsSelect,
  ApiPosTerminalsSelect,
  ApiPurchaseOrderItemsSelect,
  ApiPurchaseOrdersSelect,
  ApiReceivableInboundDeliveriesSelect,
  ApiReceivablePurchaseOrdersSelect,
  ApiSiteSuppliersSelect,
  ApiSupplierItemsSelect,
  ApiSuppliersSelect,
  ApiTaxClassesSelect,
  ApiTaxComponentsSelect,
  ApiTaxGroupsSelect,
  ApiTaxJurisdictionsSelect,
  ApiUomDimensionsSelect,
  ApiUomSelect,
} from './docs/select-api.docs';
import { InventoryItemMrpsSelectQueryDto } from './dto/inventory-item-mrps-select-query.dto';
import { OfferingVariantsSelectQueryDto } from './dto/offering-variants-select-query.dto';
import { OfferingsSelectQueryDto } from './dto/offerings-select-query.dto';

@ApiTags('Commerce - Select')
@ApiBearerAuth()
@Require(AuthType.Session, SessionTypeValues.WEB, SessionTypeValues.MOBILE)
@Controller('select-api')
export class SelectApiController {
  constructor(private readonly nats: NatsClientService) {}

  @Get('categories')
  @ApiCategoriesSelect()
  selectCategories(@Query() query: CategoriesSelectQueryDto): Promise<SelectQueryResult> {
    return this.nats.send<SelectQueryResult>('commerce', 'select.categories', query);
  }

  @Get('cost-categories')
  @ApiCostCategoriesSelect()
  selectCostCategories(@Query() query: SelectOptionsQueryDto): Promise<SelectQueryResult> {
    return this.nats.send<SelectQueryResult>('commerce', 'select.costCategories', query);
  }

  @Get('customers')
  @ApiCustomersSelect()
  selectCustomers(@Query() query: SelectOptionsQueryDto): Promise<SelectQueryResult> {
    return this.nats.send<SelectQueryResult>('commerce', 'select.customers', query);
  }

  @Get('inventory-item-lots')
  @ApiInventoryItemLotsSelect()
  selectInventoryItemLots(@Query() query: LotsSelectQueryDto): Promise<SelectQueryResult> {
    return this.nats.send<SelectQueryResult>('commerce', 'select.inventoryItemLots', query);
  }

  @Get('inventory-item-mrps')
  @ApiInventoryItemMrpsSelect()
  selectInventoryItemMrps(@Query() query: InventoryItemMrpsSelectQueryDto): Promise<SelectQueryResult> {
    return this.nats.send<SelectQueryResult>('commerce', 'select.inventoryItemMrps', query);
  }

  @Get('inventory-item-quants')
  @ApiInventoryItemQuantsSelect()
  selectInventoryItemQuants(@Query() query: QuantsSelectQueryDto): Promise<SelectQueryResult> {
    return this.nats.send<SelectQueryResult>('commerce', 'select.inventoryItemQuants', query);
  }

  @Get('inventory-item-serials')
  @ApiInventoryItemSerialsSelect()
  selectInventoryItemSerials(@Query() query: SerialsSelectQueryDto): Promise<SelectQueryResult> {
    return this.nats.send<SelectQueryResult>('commerce', 'select.inventoryItemSerials', query);
  }

  @Get('inventory-items')
  @ApiInventoryItemsSelect()
  selectInventoryItems(@Query() query: InventoryItemsSelectQueryDto): Promise<SelectQueryResult> {
    return this.nats.send<SelectQueryResult>('commerce', 'select.inventoryItems', query);
  }

  @Get('locations')
  @ApiLocationsSelect()
  selectLocations(@Query() query: LocationsSelectQueryDto): Promise<SelectQueryResult> {
    return this.nats.send<SelectQueryResult>('commerce', 'select.locations', query);
  }

  @Get('offerings')
  @ApiOfferingsSelect()
  selectOfferings(@Query() query: OfferingsSelectQueryDto): Promise<SelectQueryResult> {
    return this.nats.send<SelectQueryResult>('commerce', 'select.offerings', query);
  }

  @Get('offering-variants')
  @ApiOfferingVariantsSelect()
  selectOfferingVariants(@Query() query: OfferingVariantsSelectQueryDto): Promise<SelectQueryResult> {
    return this.nats.send<SelectQueryResult>('commerce', 'select.offeringVariants', query);
  }

  @Get('dimension-templates')
  @ApiDimensionTemplatesSelect()
  selectDimensionTemplates(@Query() query: SelectOptionsQueryDto): Promise<SelectQueryResult> {
    return this.nats.send<SelectQueryResult>('commerce', 'select.dimensionTemplates', query);
  }

  @Get('attribute-templates')
  @ApiAttributeTemplatesSelect()
  selectAttributeTemplates(@Query() query: SelectOptionsQueryDto): Promise<SelectQueryResult> {
    return this.nats.send<SelectQueryResult>('commerce', 'select.attributeTemplates', query);
  }

  @Get('catalogs')
  @ApiCatalogsSelect()
  selectCatalogs(@Query() query: SelectOptionsQueryDto): Promise<SelectQueryResult> {
    return this.nats.send<SelectQueryResult>('commerce', 'org.catalogs.select', query);
  }

  @Get('pos-terminals')
  @ApiPosTerminalsSelect()
  selectPosTerminals(@Query() query: SelectOptionsQueryDto): Promise<SelectQueryResult> {
    return this.nats.send<SelectQueryResult>('commerce', 'select.posTerminals', query);
  }

  @Get('purchase-order-items')
  @ApiPurchaseOrderItemsSelect()
  selectPurchaseOrderItems(@Query() query: PurchaseOrderItemsSelectQueryDto): Promise<SelectQueryResult> {
    return this.nats.send<SelectQueryResult>('commerce', 'select.purchaseOrderItems', query);
  }

  // Returns a supplier's purchase orders a goods receipt can receive
  @Get('receivable-purchase-orders')
  @ApiReceivablePurchaseOrdersSelect()
  selectReceivablePurchaseOrders(@Query() query: ReceivablePurchaseOrdersSelectQueryDto): Promise<SelectQueryResult> {
    return this.nats.send<SelectQueryResult>('commerce', 'select.receivablePurchaseOrders', query);
  }

  // Returns the announced inbound deliveries a goods receipt can be created from
  @Get('receivable-inbound-deliveries')
  @ApiReceivableInboundDeliveriesSelect()
  selectReceivableInboundDeliveries(@Query() query: SelectOptionsQueryDto): Promise<SelectQueryResult> {
    return this.nats.send<SelectQueryResult>('commerce', 'select.receivableInboundDeliveries', query);
  }

  // Returns the open purchase order lines that can still go on an inbound delivery
  @Get('deliverable-purchase-order-items')
  @ApiDeliverablePurchaseOrderItemsSelect()
  selectDeliverablePurchaseOrderItems(
    @Query() query: DeliverablePurchaseOrderItemsSelectQueryDto,
  ): Promise<SelectQueryResult> {
    return this.nats.send<SelectQueryResult>('commerce', 'select.deliverablePurchaseOrderItems', query);
  }

  @Get('purchase-orders')
  @ApiPurchaseOrdersSelect()
  selectPurchaseOrders(@Query() query: PurchaseOrderSelectQueryDto): Promise<SelectQueryResult> {
    return this.nats.send<SelectQueryResult>('commerce', 'select.purchaseOrders', query);
  }

  @Get('supplier-items')
  @ApiSupplierItemsSelect()
  selectSupplierItems(@Query() query: SupplierItemsSelectQueryDto): Promise<SelectQueryResult> {
    return this.nats.send<SelectQueryResult>('commerce', 'select.supplierItems', query);
  }

  @Get('suppliers')
  @ApiSuppliersSelect()
  selectSuppliers(@Query() query: SuppliersSelectQueryDto): Promise<SelectQueryResult> {
    return this.nats.send<SelectQueryResult>('commerce', 'select.suppliers', query);
  }

  @Get('site-suppliers')
  @ApiSiteSuppliersSelect()
  selectSiteSuppliers(@Query() query: SupplierEnrollmentSelectQueryDto): Promise<SelectQueryResult> {
    return this.nats.send<SelectQueryResult>('commerce', 'site.suppliers.select', query);
  }

  @Get('payment-terms')
  @ApiPaymentTermsSelect()
  selectPaymentTerms(@Query() query: PaymentTermsSelectQueryDto): Promise<SelectQueryResult> {
    return this.nats.send<SelectQueryResult>('commerce', 'select.paymentTerms', query);
  }

  @Get('tax-classes')
  @ApiTaxClassesSelect()
  selectTaxClasses(@Query() query: SelectOptionsQueryDto): Promise<SelectQueryResult> {
    return this.nats.send<SelectQueryResult>('commerce', 'select.taxClasses', query);
  }

  // Returns person (PERSON party) options for select dropdowns
  @Get('people')
  selectPeople(@Query() query: SelectOptionsQueryDto): Promise<SelectQueryResult> {
    return this.nats.send<SelectQueryResult>('commerce', 'select.people', query);
  }

  // Returns company (COMPANY party) options for select dropdowns
  @Get('companies')
  selectCompanies(@Query() query: SelectOptionsQueryDto): Promise<SelectQueryResult> {
    return this.nats.send<SelectQueryResult>('commerce', 'select.companies', query);
  }

  // Returns tax registration options of a party for select dropdowns, optionally only active GSTIN/VAT ones
  @Get('party-tax-registrations')
  selectPartyTaxRegistrations(@Query() query: PartyTaxRegistrationSelectQueryDto): Promise<SelectQueryResult> {
    return this.nats.send<SelectQueryResult>('commerce', 'select.partyTaxRegistrations', query);
  }

  // Returns bank account options of a party for select dropdowns
  @Get('party-bank-accounts')
  selectPartyBankAccounts(@Query() query: PartySelectQueryDto): Promise<SelectQueryResult> {
    return this.nats.send<SelectQueryResult>('commerce', 'select.partyBankAccounts', query);
  }

  // Returns a party's email or phone options for select dropdowns, optionally only those holding a function
  @Get('party-communications')
  selectPartyCommunications(@Query() query: PartyCommunicationSelectQueryDto): Promise<SelectQueryResult> {
    return this.nats.send<SelectQueryResult>('commerce', 'select.partyCommunications', query);
  }

  // Returns contact options of a party for select dropdowns, optionally filtered by function
  @Get('party-contacts')
  selectPartyContacts(@Query() query: PartyContactSelectQueryDto): Promise<SelectQueryResult> {
    return this.nats.send<SelectQueryResult>('commerce', 'select.partyContacts', query);
  }

  // Returns tax-jurisdiction options for select dropdowns, only one country's when `country` is given
  @Get('tax-jurisdictions')
  @ApiTaxJurisdictionsSelect()
  selectTaxJurisdictions(@Query() query: TaxJurisdictionSelectQueryDto): Promise<SelectQueryResult> {
    return this.nats.send<SelectQueryResult>('commerce', 'select.taxJurisdictions', query);
  }

  // Returns tax-component options for select dropdowns, only one country's when `country` is given
  @Get('tax-components')
  @ApiTaxComponentsSelect()
  selectTaxComponents(@Query() query: TaxComponentsSelectQueryDto): Promise<SelectQueryResult> {
    return this.nats.send<SelectQueryResult>('commerce', 'select.taxComponents', query);
  }

  // Returns tax-group options for select dropdowns, only one country's when `country` is given
  @Get('tax-groups')
  @ApiTaxGroupsSelect()
  selectTaxGroups(@Query() query: TaxGroupsSelectQueryDto): Promise<SelectQueryResult> {
    return this.nats.send<SelectQueryResult>('commerce', 'select.taxGroups', query);
  }

  @Get('uom')
  @ApiUomSelect()
  selectUom(@Query() query: UomSelectQueryDto): Promise<SelectQueryResult> {
    return this.nats.send<SelectQueryResult>('commerce', 'select.uom', query);
  }

  @Get('uom-dimensions')
  @ApiUomDimensionsSelect()
  selectUomDimensions(@Query() query: SelectOptionsQueryDto): Promise<SelectQueryResult> {
    return this.nats.send<SelectQueryResult>('commerce', 'select.uomDimensions', query);
  }
}
