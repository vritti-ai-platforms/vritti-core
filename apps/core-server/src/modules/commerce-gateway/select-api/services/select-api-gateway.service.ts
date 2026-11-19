import type { CategoriesSelectQueryDto } from '@commerce/categories/dto/request/categories-select-query.dto';
import type { CostCategoriesSelectQueryDto } from '@commerce/cost-categories/dto/request/cost-categories-select-query.dto';
import type { DeliverablePurchaseOrderItemsSelectQueryDto } from '@commerce/inbound-deliveries/dto/request/deliverable-purchase-order-items-select-query.dto';
import type { LotsSelectQueryDto } from '@commerce/inventory-item-lots/dto/request/lots-select-query.dto';
import type { QuantsSelectQueryDto } from '@commerce/inventory-item-quants/dto/request/quants-select-query.dto';
import type { SerialsSelectQueryDto } from '@commerce/inventory-item-serials/dto/request/serials-select-query.dto';
import type { InventoryItemsSelectQueryDto } from '@commerce/inventory-items/dto/request/inventory-items-select-query.dto';
import type { InventoryItemUnitsResponseDto } from '@commerce/inventory-items/dto/response/inventory-item-units-response.dto';
import type { LocationsSelectQueryDto } from '@commerce/locations/dto/request/locations-select-query.dto';
import type { PartyCommunicationSelectQueryDto } from '@commerce/parties/dto/request/party-communication-select-query.dto';
import type { PartyContactSelectQueryDto } from '@commerce/parties/dto/request/party-contact-select-query.dto';
import type { PartySelectQueryDto } from '@commerce/parties/dto/request/party-select-query.dto';
import type { PartyTaxRegistrationSelectQueryDto } from '@commerce/parties/dto/request/party-tax-registration-select-query.dto';
import type { PaymentTermsSelectQueryDto } from '@commerce/payment-terms/dto/request/payment-terms-select-query.dto';
import type { PurchaseOrderItemsSelectQueryDto } from '@commerce/purchase-orders/dto/request/purchase-order-items-select-query.dto';
import type { PurchaseOrderSelectQueryDto } from '@commerce/purchase-orders/dto/request/purchase-order-select-query.dto';
import type { SupplierEnrollmentSelectQueryDto } from '@commerce/supplier-enrollments/dto/request/supplier-enrollment-select-query.dto';
import type { SupplierItemsSelectQueryDto } from '@commerce/supplier-items/dto/request/supplier-items-select-query.dto';
import type { SuppliersSelectQueryDto } from '@commerce/suppliers/dto/request/suppliers-select-query.dto';
import type { TaxComponentsSelectQueryDto } from '@commerce/tax-components/dto/request/tax-components-select-query.dto';
import type { TaxGroupsSelectQueryDto } from '@commerce/tax-groups/dto/request/tax-groups-select-query.dto';
import type { TaxJurisdictionSelectQueryDto } from '@commerce/tax-jurisdictions/dto/request/tax-jurisdiction-select-query.dto';
import type { UomSelectQueryDto } from '@commerce/uom/dto/request/uom-select-query.dto';
import { SiteDomainService } from '@domain/site/services/site.service';
import { Injectable, Logger } from '@nestjs/common';
import { BadRequestException } from '@vritti/api-sdk/exceptions';
import { NatsClientService } from '@vritti/api-sdk/nats';
import type { SelectOptionsQueryDto, SelectQueryResult } from '@vritti/api-sdk/select';
import type { InventoryItemMrpsSelectQueryDto } from '../dto/inventory-item-mrps-select-query.dto';
import type { OfferingVariantsSelectQueryDto } from '../dto/offering-variants-select-query.dto';
import type { OfferingsSelectQueryDto } from '../dto/offerings-select-query.dto';

@Injectable()
export class SelectApiGatewayService {
  private readonly logger = new Logger(SelectApiGatewayService.name);

  constructor(
    private readonly nats: NatsClientService,
    private readonly siteService: SiteDomainService,
  ) {}

  // Returns category options for select dropdowns
  selectCategories(query: CategoriesSelectQueryDto): Promise<SelectQueryResult> {
    this.logger.log('select.categories');
    return this.nats.send<SelectQueryResult>('commerce', 'select.categories', query);
  }

  // Returns cost category options for select dropdowns, only the chargeable ones when `chargeOnly` is set
  selectCostCategories(query: CostCategoriesSelectQueryDto): Promise<SelectQueryResult> {
    this.logger.log('select.costCategories');
    return this.nats.send<SelectQueryResult>('commerce', 'select.costCategories', query);
  }

  // Returns customer options for select dropdowns
  selectCustomers(query: SelectOptionsQueryDto): Promise<SelectQueryResult> {
    this.logger.log('select.customers');
    return this.nats.send<SelectQueryResult>('commerce', 'select.customers', query);
  }

  // Returns an inventory item's lot options for select dropdowns
  selectInventoryItemLots(query: LotsSelectQueryDto): Promise<SelectQueryResult> {
    this.logger.log('select.inventoryItemLots');
    return this.nats.send<SelectQueryResult>('commerce', 'select.inventoryItemLots', query);
  }

  // Returns an inventory item's MRP options for select dropdowns
  selectInventoryItemMrps(query: InventoryItemMrpsSelectQueryDto): Promise<SelectQueryResult> {
    this.logger.log('select.inventoryItemMrps');
    return this.nats.send<SelectQueryResult>('commerce', 'select.inventoryItemMrps', query);
  }

  // Returns an inventory item's quant options for select dropdowns
  selectInventoryItemQuants(query: QuantsSelectQueryDto): Promise<SelectQueryResult> {
    this.logger.log('select.inventoryItemQuants');
    return this.nats.send<SelectQueryResult>('commerce', 'select.inventoryItemQuants', query);
  }

  // Returns an inventory item's serial options for select dropdowns
  selectInventoryItemSerials(query: SerialsSelectQueryDto): Promise<SelectQueryResult> {
    this.logger.log('select.inventoryItemSerials');
    return this.nats.send<SelectQueryResult>('commerce', 'select.inventoryItemSerials', query);
  }

  // Returns the units a quantity of the item can be entered in, with their ratios to its primary unit
  findInventoryItemUnits(inventoryItemId: string): Promise<InventoryItemUnitsResponseDto> {
    this.logger.log(`select.inventoryItemUnits — inventoryItemId: ${inventoryItemId}`);
    return this.nats.send<InventoryItemUnitsResponseDto>('commerce', 'select.inventoryItemUnits', { inventoryItemId });
  }

  // Returns inventory item options for select dropdowns; with a site named, only those it carries, each with its stock
  // and levels there, or only those it does not carry yet
  async selectInventoryItems(
    query: InventoryItemsSelectQueryDto,
    workspaceSiteId: string | undefined,
    legalEntityId: string | undefined,
  ): Promise<SelectQueryResult> {
    if (query.atSiteId) await this.assertSiteInWorkspace(query.atSiteId, workspaceSiteId, legalEntityId, 'atSiteId');
    if (query.notAtSiteId) {
      await this.assertSiteInWorkspace(query.notAtSiteId, workspaceSiteId, legalEntityId, 'notAtSiteId');
    }
    this.logger.log(
      `select.inventoryItems — atSiteId: ${query.atSiteId ?? '-'}, notAtSiteId: ${query.notAtSiteId ?? '-'}`,
    );
    return this.nats.send<SelectQueryResult>('commerce', 'select.inventoryItems', query);
  }

  // Returns offering options for select dropdowns
  selectOfferings(query: OfferingsSelectQueryDto): Promise<SelectQueryResult> {
    this.logger.log('select.offerings');
    return this.nats.send<SelectQueryResult>('commerce', 'select.offerings', query);
  }

  // Returns offering variant options for select dropdowns
  selectOfferingVariants(query: OfferingVariantsSelectQueryDto): Promise<SelectQueryResult> {
    this.logger.log('select.offeringVariants');
    return this.nats.send<SelectQueryResult>('commerce', 'select.offeringVariants', query);
  }

  // Returns dimension template options for select dropdowns
  selectDimensionTemplates(query: SelectOptionsQueryDto): Promise<SelectQueryResult> {
    this.logger.log('select.dimensionTemplates');
    return this.nats.send<SelectQueryResult>('commerce', 'select.dimensionTemplates', query);
  }

  // Returns attribute template options for select dropdowns
  selectAttributeTemplates(query: SelectOptionsQueryDto): Promise<SelectQueryResult> {
    this.logger.log('select.attributeTemplates');
    return this.nats.send<SelectQueryResult>('commerce', 'select.attributeTemplates', query);
  }

  // Returns catalog options for select dropdowns
  selectCatalogs(query: SelectOptionsQueryDto): Promise<SelectQueryResult> {
    this.logger.log('org.catalogs.select');
    return this.nats.send<SelectQueryResult>('commerce', 'org.catalogs.select', query);
  }

  // Returns POS terminal options for select dropdowns
  selectPosTerminals(query: SelectOptionsQueryDto): Promise<SelectQueryResult> {
    this.logger.log('select.posTerminals');
    return this.nats.send<SelectQueryResult>('commerce', 'select.posTerminals', query);
  }

  // Returns the line options of one purchase order for select dropdowns
  selectPurchaseOrderItems(query: PurchaseOrderItemsSelectQueryDto): Promise<SelectQueryResult> {
    this.logger.log('select.purchaseOrderItems');
    return this.nats.send<SelectQueryResult>('commerce', 'select.purchaseOrderItems', query);
  }

  // Returns the announced inbound deliveries a goods receipt can be created from
  selectReceivableInboundDeliveries(query: SelectOptionsQueryDto): Promise<SelectQueryResult> {
    this.logger.log('select.receivableInboundDeliveries');
    return this.nats.send<SelectQueryResult>('commerce', 'select.receivableInboundDeliveries', query);
  }

  // Returns the open purchase order lines that can still go on an inbound delivery
  selectDeliverablePurchaseOrderItems(query: DeliverablePurchaseOrderItemsSelectQueryDto): Promise<SelectQueryResult> {
    this.logger.log('select.deliverablePurchaseOrderItems');
    return this.nats.send<SelectQueryResult>('commerce', 'select.deliverablePurchaseOrderItems', query);
  }

  // Returns purchase order options for select dropdowns
  selectPurchaseOrders(query: PurchaseOrderSelectQueryDto): Promise<SelectQueryResult> {
    this.logger.log('select.purchaseOrders');
    return this.nats.send<SelectQueryResult>('commerce', 'select.purchaseOrders', query);
  }

  // Returns purchase options of the workspace's sites for select dropdowns
  selectPurchases(query: SelectOptionsQueryDto): Promise<SelectQueryResult> {
    this.logger.log('select.purchases');
    return this.nats.send<SelectQueryResult>('commerce', 'select.purchases', query);
  }

  // Returns supplier item options for select dropdowns
  selectSupplierItems(query: SupplierItemsSelectQueryDto): Promise<SelectQueryResult> {
    this.logger.log('select.supplierItems');
    return this.nats.send<SelectQueryResult>('commerce', 'select.supplierItems', query);
  }

  // Returns the options of the suppliers enrolled at the site for select dropdowns
  selectSiteSuppliers(query: SupplierEnrollmentSelectQueryDto): Promise<SelectQueryResult> {
    this.logger.log('site.suppliers.select');
    return this.nats.send<SelectQueryResult>('commerce', 'site.suppliers.select', query);
  }

  // Returns payment term options for select dropdowns
  selectPaymentTerms(query: PaymentTermsSelectQueryDto): Promise<SelectQueryResult> {
    this.logger.log('select.paymentTerms');
    return this.nats.send<SelectQueryResult>('commerce', 'select.paymentTerms', query);
  }

  // Returns storage type options for select dropdowns
  selectStorageTypes(query: SelectOptionsQueryDto): Promise<SelectQueryResult> {
    this.logger.log('select.storageTypes');
    return this.nats.send<SelectQueryResult>('commerce', 'select.storageTypes', query);
  }

  // Returns tax class options for select dropdowns
  selectTaxClasses(query: SelectOptionsQueryDto): Promise<SelectQueryResult> {
    this.logger.log('select.taxClasses');
    return this.nats.send<SelectQueryResult>('commerce', 'select.taxClasses', query);
  }

  // Returns person (PERSON party) options for select dropdowns
  selectPeople(query: SelectOptionsQueryDto): Promise<SelectQueryResult> {
    this.logger.log('select.people');
    return this.nats.send<SelectQueryResult>('commerce', 'select.people', query);
  }

  // Returns company (COMPANY party) options for select dropdowns
  selectCompanies(query: SelectOptionsQueryDto): Promise<SelectQueryResult> {
    this.logger.log('select.companies');
    return this.nats.send<SelectQueryResult>('commerce', 'select.companies', query);
  }

  // Returns tax registration options of a party for select dropdowns, optionally only active GSTIN/VAT ones
  selectPartyTaxRegistrations(query: PartyTaxRegistrationSelectQueryDto): Promise<SelectQueryResult> {
    this.logger.log('select.partyTaxRegistrations');
    return this.nats.send<SelectQueryResult>('commerce', 'select.partyTaxRegistrations', query);
  }

  // Returns bank account options of a party for select dropdowns
  selectPartyBankAccounts(query: PartySelectQueryDto): Promise<SelectQueryResult> {
    this.logger.log('select.partyBankAccounts');
    return this.nats.send<SelectQueryResult>('commerce', 'select.partyBankAccounts', query);
  }

  // Returns a party's email or phone options for select dropdowns, optionally only those holding a function
  selectPartyCommunications(query: PartyCommunicationSelectQueryDto): Promise<SelectQueryResult> {
    this.logger.log('select.partyCommunications');
    return this.nats.send<SelectQueryResult>('commerce', 'select.partyCommunications', query);
  }

  // Returns contact options of a party for select dropdowns, optionally filtered by function
  selectPartyContacts(query: PartyContactSelectQueryDto): Promise<SelectQueryResult> {
    this.logger.log('select.partyContacts');
    return this.nats.send<SelectQueryResult>('commerce', 'select.partyContacts', query);
  }

  // Returns tax-jurisdiction options for select dropdowns, only one country's when `country` is given
  selectTaxJurisdictions(query: TaxJurisdictionSelectQueryDto): Promise<SelectQueryResult> {
    this.logger.log('select.taxJurisdictions');
    return this.nats.send<SelectQueryResult>('commerce', 'select.taxJurisdictions', query);
  }

  // Returns tax-component options for select dropdowns, only one country's when `country` is given
  selectTaxComponents(query: TaxComponentsSelectQueryDto): Promise<SelectQueryResult> {
    this.logger.log('select.taxComponents');
    return this.nats.send<SelectQueryResult>('commerce', 'select.taxComponents', query);
  }

  // Returns tax-group options for select dropdowns, only one country's when `country` is given
  selectTaxGroups(query: TaxGroupsSelectQueryDto): Promise<SelectQueryResult> {
    this.logger.log('select.taxGroups');
    return this.nats.send<SelectQueryResult>('commerce', 'select.taxGroups', query);
  }

  // Returns unit of measure options for select dropdowns
  selectUom(query: UomSelectQueryDto): Promise<SelectQueryResult> {
    this.logger.log('select.uom');
    return this.nats.send<SelectQueryResult>('commerce', 'select.uom', query);
  }

  // Returns unit of measure dimension options for select dropdowns
  selectUomDimensions(query: SelectOptionsQueryDto): Promise<SelectQueryResult> {
    this.logger.log('select.uomDimensions');
    return this.nats.send<SelectQueryResult>('commerce', 'select.uomDimensions', query);
  }

  // Returns supplier options, narrowed to the suppliers enrolled at one of the legal entity's sites when one is named
  selectSuppliers(query: SuppliersSelectQueryDto): Promise<SelectQueryResult> {
    this.logger.log(`select.suppliers — enrolledAtSiteId: ${query.enrolledAtSiteId ?? '-'}`);
    return this.nats.send<SelectQueryResult>('commerce', 'select.suppliers', query);
  }

  // Returns location options, narrowed to one of the legal entity's sites when one is named
  selectLocations(query: LocationsSelectQueryDto): Promise<SelectQueryResult> {
    this.logger.log(`select.locations — atSiteId: ${query.atSiteId ?? '-'}`);
    return this.nats.send<SelectQueryResult>('commerce', 'select.locations', query);
  }

  // Rejects a site the user is not working in: a site workspace may name only itself, a legal entity one of its sites
  private async assertSiteInWorkspace(
    siteId: string,
    workspaceSiteId: string | undefined,
    legalEntityId: string | undefined,
    field: string,
  ): Promise<void> {
    if (!workspaceSiteId) return this.assertSiteInLegalEntity(siteId, legalEntityId, field);
    if (siteId === workspaceSiteId) return;
    throw new BadRequestException({
      label: 'Site Not In Workspace',
      detail: 'Only the site you are working in can be picked.',
      errors: [{ field, message: 'Not your site' }],
    });
  }

  // Rejects a site outside the legal entity the user is working in
  private async assertSiteInLegalEntity(
    siteId: string,
    legalEntityId: string | undefined,
    field: string,
  ): Promise<void> {
    const site = await this.siteService.findById(siteId);
    if (site.legalEntityId !== legalEntityId) {
      throw new BadRequestException({
        label: 'Site Not In Company',
        detail: 'Only the sites of the company you are working in can be picked.',
        errors: [{ field, message: 'Not one of your sites' }],
      });
    }
  }
}
