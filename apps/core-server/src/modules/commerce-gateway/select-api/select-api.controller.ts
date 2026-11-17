import { CategoriesSelectQueryDto } from '@commerce/categories/dto/request/categories-select-query.dto';
import { CostCategoriesSelectQueryDto } from '@commerce/cost-categories/dto/request/cost-categories-select-query.dto';
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
import { Controller, Get, Logger, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AuthType, Require } from '@vritti/api-sdk/auth';
import { SelectOptionsQueryDto, type SelectQueryResult } from '@vritti/api-sdk/select';
import { SessionTypeValues } from '@/db/schema';
import { LegalEntityId, SiteId } from '@/security/decorators';
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
  ApiPurchasesSelect,
  ApiReceivableInboundDeliveriesSelect,
  ApiSiteSuppliersSelect,
  ApiStorageTypesSelect,
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
import { SelectApiGatewayService } from './services/select-api-gateway.service';

@ApiTags('Commerce - Select')
@ApiBearerAuth()
@Require(AuthType.Session, SessionTypeValues.WEB, SessionTypeValues.MOBILE)
@Controller('select-api')
export class SelectApiController {
  private readonly logger = new Logger(SelectApiController.name);

  constructor(private readonly service: SelectApiGatewayService) {}

  // Returns category options for select dropdowns
  @Get('categories')
  @ApiCategoriesSelect()
  selectCategories(@Query() query: CategoriesSelectQueryDto): Promise<SelectQueryResult> {
    this.logger.log('GET /commerce-api/select-api/categories');
    return this.service.selectCategories(query);
  }

  // Returns cost category options for select dropdowns, only the chargeable ones when `chargeOnly` is set
  @Get('cost-categories')
  @ApiCostCategoriesSelect()
  selectCostCategories(@Query() query: CostCategoriesSelectQueryDto): Promise<SelectQueryResult> {
    this.logger.log('GET /commerce-api/select-api/cost-categories');
    return this.service.selectCostCategories(query);
  }

  // Returns customer options for select dropdowns
  @Get('customers')
  @ApiCustomersSelect()
  selectCustomers(@Query() query: SelectOptionsQueryDto): Promise<SelectQueryResult> {
    this.logger.log('GET /commerce-api/select-api/customers');
    return this.service.selectCustomers(query);
  }

  // Returns an inventory item's lot options for select dropdowns
  @Get('inventory-item-lots')
  @ApiInventoryItemLotsSelect()
  selectInventoryItemLots(@Query() query: LotsSelectQueryDto): Promise<SelectQueryResult> {
    this.logger.log('GET /commerce-api/select-api/inventory-item-lots');
    return this.service.selectInventoryItemLots(query);
  }

  // Returns an inventory item's MRP options for select dropdowns
  @Get('inventory-item-mrps')
  @ApiInventoryItemMrpsSelect()
  selectInventoryItemMrps(@Query() query: InventoryItemMrpsSelectQueryDto): Promise<SelectQueryResult> {
    this.logger.log('GET /commerce-api/select-api/inventory-item-mrps');
    return this.service.selectInventoryItemMrps(query);
  }

  // Returns an inventory item's quant options for select dropdowns
  @Get('inventory-item-quants')
  @ApiInventoryItemQuantsSelect()
  selectInventoryItemQuants(@Query() query: QuantsSelectQueryDto): Promise<SelectQueryResult> {
    this.logger.log('GET /commerce-api/select-api/inventory-item-quants');
    return this.service.selectInventoryItemQuants(query);
  }

  // Returns an inventory item's serial options for select dropdowns
  @Get('inventory-item-serials')
  @ApiInventoryItemSerialsSelect()
  selectInventoryItemSerials(@Query() query: SerialsSelectQueryDto): Promise<SelectQueryResult> {
    this.logger.log('GET /commerce-api/select-api/inventory-item-serials');
    return this.service.selectInventoryItemSerials(query);
  }

  // Returns inventory item options for select dropdowns, only those with, or without, stock levels at a site when one is
  // named
  @Get('inventory-items')
  @ApiInventoryItemsSelect()
  selectInventoryItems(
    @Query() query: InventoryItemsSelectQueryDto,
    @SiteId() siteId: string | undefined,
    @LegalEntityId() legalEntityId: string | undefined,
  ): Promise<SelectQueryResult> {
    this.logger.log('GET /commerce-api/select-api/inventory-items');
    return this.service.selectInventoryItems(query, siteId, legalEntityId);
  }

  // Returns location options for select dropdowns, only one of the legal entity's sites' when `atSiteId` is given
  @Get('locations')
  @ApiLocationsSelect()
  selectLocations(@Query() query: LocationsSelectQueryDto): Promise<SelectQueryResult> {
    this.logger.log('GET /commerce-api/select-api/locations');
    return this.service.selectLocations(query);
  }

  // Returns offering options for select dropdowns
  @Get('offerings')
  @ApiOfferingsSelect()
  selectOfferings(@Query() query: OfferingsSelectQueryDto): Promise<SelectQueryResult> {
    this.logger.log('GET /commerce-api/select-api/offerings');
    return this.service.selectOfferings(query);
  }

  // Returns offering variant options for select dropdowns
  @Get('offering-variants')
  @ApiOfferingVariantsSelect()
  selectOfferingVariants(@Query() query: OfferingVariantsSelectQueryDto): Promise<SelectQueryResult> {
    this.logger.log('GET /commerce-api/select-api/offering-variants');
    return this.service.selectOfferingVariants(query);
  }

  // Returns dimension template options for select dropdowns
  @Get('dimension-templates')
  @ApiDimensionTemplatesSelect()
  selectDimensionTemplates(@Query() query: SelectOptionsQueryDto): Promise<SelectQueryResult> {
    this.logger.log('GET /commerce-api/select-api/dimension-templates');
    return this.service.selectDimensionTemplates(query);
  }

  // Returns attribute template options for select dropdowns
  @Get('attribute-templates')
  @ApiAttributeTemplatesSelect()
  selectAttributeTemplates(@Query() query: SelectOptionsQueryDto): Promise<SelectQueryResult> {
    this.logger.log('GET /commerce-api/select-api/attribute-templates');
    return this.service.selectAttributeTemplates(query);
  }

  // Returns catalog options for select dropdowns
  @Get('catalogs')
  @ApiCatalogsSelect()
  selectCatalogs(@Query() query: SelectOptionsQueryDto): Promise<SelectQueryResult> {
    this.logger.log('GET /commerce-api/select-api/catalogs');
    return this.service.selectCatalogs(query);
  }

  // Returns POS terminal options for select dropdowns
  @Get('pos-terminals')
  @ApiPosTerminalsSelect()
  selectPosTerminals(@Query() query: SelectOptionsQueryDto): Promise<SelectQueryResult> {
    this.logger.log('GET /commerce-api/select-api/pos-terminals');
    return this.service.selectPosTerminals(query);
  }

  // Returns the line options of one purchase order for select dropdowns
  @Get('purchase-order-items')
  @ApiPurchaseOrderItemsSelect()
  selectPurchaseOrderItems(@Query() query: PurchaseOrderItemsSelectQueryDto): Promise<SelectQueryResult> {
    this.logger.log('GET /commerce-api/select-api/purchase-order-items');
    return this.service.selectPurchaseOrderItems(query);
  }

  // Returns the announced inbound deliveries a goods receipt can be created from
  @Get('receivable-inbound-deliveries')
  @ApiReceivableInboundDeliveriesSelect()
  selectReceivableInboundDeliveries(@Query() query: SelectOptionsQueryDto): Promise<SelectQueryResult> {
    this.logger.log('GET /commerce-api/select-api/receivable-inbound-deliveries');
    return this.service.selectReceivableInboundDeliveries(query);
  }

  // Returns the open purchase order lines that can still go on an inbound delivery
  @Get('deliverable-purchase-order-items')
  @ApiDeliverablePurchaseOrderItemsSelect()
  selectDeliverablePurchaseOrderItems(
    @Query() query: DeliverablePurchaseOrderItemsSelectQueryDto,
  ): Promise<SelectQueryResult> {
    this.logger.log('GET /commerce-api/select-api/deliverable-purchase-order-items');
    return this.service.selectDeliverablePurchaseOrderItems(query);
  }

  // Returns purchase order options for select dropdowns
  @Get('purchase-orders')
  @ApiPurchaseOrdersSelect()
  selectPurchaseOrders(@Query() query: PurchaseOrderSelectQueryDto): Promise<SelectQueryResult> {
    this.logger.log('GET /commerce-api/select-api/purchase-orders');
    return this.service.selectPurchaseOrders(query);
  }

  // Returns purchase options of the workspace's sites for select dropdowns
  @Get('purchases')
  @ApiPurchasesSelect()
  selectPurchases(@Query() query: SelectOptionsQueryDto): Promise<SelectQueryResult> {
    this.logger.log('GET /commerce-api/select-api/purchases');
    return this.service.selectPurchases(query);
  }

  // Returns supplier item options for select dropdowns
  @Get('supplier-items')
  @ApiSupplierItemsSelect()
  selectSupplierItems(@Query() query: SupplierItemsSelectQueryDto): Promise<SelectQueryResult> {
    this.logger.log('GET /commerce-api/select-api/supplier-items');
    return this.service.selectSupplierItems(query);
  }

  // Returns supplier options for select dropdowns, only those enrolled at one of the legal entity's sites when `enrolledAtSiteId` is given
  @Get('suppliers')
  @ApiSuppliersSelect()
  selectSuppliers(@Query() query: SuppliersSelectQueryDto): Promise<SelectQueryResult> {
    this.logger.log('GET /commerce-api/select-api/suppliers');
    return this.service.selectSuppliers(query);
  }

  // Returns the options of the suppliers enrolled at the site for select dropdowns
  @Get('site-suppliers')
  @ApiSiteSuppliersSelect()
  selectSiteSuppliers(@Query() query: SupplierEnrollmentSelectQueryDto): Promise<SelectQueryResult> {
    this.logger.log('GET /commerce-api/select-api/site-suppliers');
    return this.service.selectSiteSuppliers(query);
  }

  // Returns payment term options for select dropdowns
  @Get('payment-terms')
  @ApiPaymentTermsSelect()
  selectPaymentTerms(@Query() query: PaymentTermsSelectQueryDto): Promise<SelectQueryResult> {
    this.logger.log('GET /commerce-api/select-api/payment-terms');
    return this.service.selectPaymentTerms(query);
  }

  // Returns storage type options for select dropdowns
  @Get('storage-types')
  @ApiStorageTypesSelect()
  selectStorageTypes(@Query() query: SelectOptionsQueryDto): Promise<SelectQueryResult> {
    this.logger.log('GET /commerce-api/select-api/storage-types');
    return this.service.selectStorageTypes(query);
  }

  // Returns tax class options for select dropdowns
  @Get('tax-classes')
  @ApiTaxClassesSelect()
  selectTaxClasses(@Query() query: SelectOptionsQueryDto): Promise<SelectQueryResult> {
    this.logger.log('GET /commerce-api/select-api/tax-classes');
    return this.service.selectTaxClasses(query);
  }

  // Returns person (PERSON party) options for select dropdowns
  @Get('people')
  selectPeople(@Query() query: SelectOptionsQueryDto): Promise<SelectQueryResult> {
    this.logger.log('GET /commerce-api/select-api/people');
    return this.service.selectPeople(query);
  }

  // Returns company (COMPANY party) options for select dropdowns
  @Get('companies')
  selectCompanies(@Query() query: SelectOptionsQueryDto): Promise<SelectQueryResult> {
    this.logger.log('GET /commerce-api/select-api/companies');
    return this.service.selectCompanies(query);
  }

  // Returns tax registration options of a party for select dropdowns, optionally only active GSTIN/VAT ones
  @Get('party-tax-registrations')
  selectPartyTaxRegistrations(@Query() query: PartyTaxRegistrationSelectQueryDto): Promise<SelectQueryResult> {
    this.logger.log('GET /commerce-api/select-api/party-tax-registrations');
    return this.service.selectPartyTaxRegistrations(query);
  }

  // Returns bank account options of a party for select dropdowns
  @Get('party-bank-accounts')
  selectPartyBankAccounts(@Query() query: PartySelectQueryDto): Promise<SelectQueryResult> {
    this.logger.log('GET /commerce-api/select-api/party-bank-accounts');
    return this.service.selectPartyBankAccounts(query);
  }

  // Returns a party's email or phone options for select dropdowns, optionally only those holding a function
  @Get('party-communications')
  selectPartyCommunications(@Query() query: PartyCommunicationSelectQueryDto): Promise<SelectQueryResult> {
    this.logger.log('GET /commerce-api/select-api/party-communications');
    return this.service.selectPartyCommunications(query);
  }

  // Returns contact options of a party for select dropdowns, optionally filtered by function
  @Get('party-contacts')
  selectPartyContacts(@Query() query: PartyContactSelectQueryDto): Promise<SelectQueryResult> {
    this.logger.log('GET /commerce-api/select-api/party-contacts');
    return this.service.selectPartyContacts(query);
  }

  // Returns tax-jurisdiction options for select dropdowns, only one country's when `country` is given
  @Get('tax-jurisdictions')
  @ApiTaxJurisdictionsSelect()
  selectTaxJurisdictions(@Query() query: TaxJurisdictionSelectQueryDto): Promise<SelectQueryResult> {
    this.logger.log('GET /commerce-api/select-api/tax-jurisdictions');
    return this.service.selectTaxJurisdictions(query);
  }

  // Returns tax-component options for select dropdowns, only one country's when `country` is given
  @Get('tax-components')
  @ApiTaxComponentsSelect()
  selectTaxComponents(@Query() query: TaxComponentsSelectQueryDto): Promise<SelectQueryResult> {
    this.logger.log('GET /commerce-api/select-api/tax-components');
    return this.service.selectTaxComponents(query);
  }

  // Returns tax-group options for select dropdowns, only one country's when `country` is given
  @Get('tax-groups')
  @ApiTaxGroupsSelect()
  selectTaxGroups(@Query() query: TaxGroupsSelectQueryDto): Promise<SelectQueryResult> {
    this.logger.log('GET /commerce-api/select-api/tax-groups');
    return this.service.selectTaxGroups(query);
  }

  // Returns unit of measure options for select dropdowns
  @Get('uom')
  @ApiUomSelect()
  selectUom(@Query() query: UomSelectQueryDto): Promise<SelectQueryResult> {
    this.logger.log('GET /commerce-api/select-api/uom');
    return this.service.selectUom(query);
  }

  // Returns unit of measure dimension options for select dropdowns
  @Get('uom-dimensions')
  @ApiUomDimensionsSelect()
  selectUomDimensions(@Query() query: SelectOptionsQueryDto): Promise<SelectQueryResult> {
    this.logger.log('GET /commerce-api/select-api/uom-dimensions');
    return this.service.selectUomDimensions(query);
  }
}
