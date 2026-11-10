import { AttributeTemplatesDomainService } from '@domain/attribute-templates/services/attribute-templates.service';
import { CategoriesSelectQueryDto } from '@domain/categories/dto/request/categories-select-query.dto';
import { CategoriesDomainService } from '@domain/categories/services/categories.service';
import { CostCategoriesDomainService } from '@domain/cost-categories/services/cost-categories.service';
import { CustomersDomainService } from '@domain/customers/services/customers.service';
import { DimensionTemplatesDomainService } from '@domain/dimension-templates/services/dimension-templates.service';
import { DeliverablePurchaseOrderItemsSelectQueryDto } from '@domain/inbound-deliveries/dto/request/deliverable-purchase-order-items-select-query.dto';
import { InboundDeliveriesDomainService } from '@domain/inbound-deliveries/services/inbound-deliveries.service';
import { InboundDeliveryLinesDomainService } from '@domain/inbound-deliveries/services/inbound-delivery-lines.service';
import { InventoryItemLotsDomainService } from '@domain/inventory-item-lots/services/inventory-item-lots.service';
import { InventoryItemMrpsDomainService } from '@domain/inventory-item-mrps/services/inventory-item-mrps.service';
import { InventoryItemQuantsDomainService } from '@domain/inventory-item-quants/services/inventory-item-quants.service';
import { InventoryItemSerialsDomainService } from '@domain/inventory-item-serials/services/inventory-item-serials.service';
import { InventoryItemsDomainService } from '@domain/inventory-items/services/inventory-items.service';
import { LocationsDomainService } from '@domain/locations/services/locations.service';
import { OfferingVariantsDomainService } from '@domain/offering-variants/services/offering-variants.service';
import { OfferingsDomainService } from '@domain/offerings/services/offerings.service';
import { PartiesDomainService } from '@domain/parties/services/parties.service';
import { PartyBankAccountsDomainService } from '@domain/party-bank-accounts/services/party-bank-accounts.service';
import { PartyCommunicationsDomainService } from '@domain/party-communications/services/party-communications.service';
import { PartyRelationshipsDomainService } from '@domain/party-relationships/services/party-relationships.service';
import { PaymentTermsDomainService } from '@domain/payment-terms/services/payment-terms.service';
import { PosTerminalsDomainService } from '@domain/pos-terminals/services/pos-terminals.service';
import { PurchaseOrderItemsDomainService } from '@domain/purchase-order-items/services/purchase-order-items.service';
import { PurchaseOrdersDomainService } from '@domain/purchase-orders/services/purchase-orders.service';
import { SupplierItemsDomainService } from '@domain/supplier-items/services/supplier-items.service';
import { SuppliersDomainService } from '@domain/suppliers/services/suppliers.service';
import { TaxClassesDomainService } from '@domain/tax-classes/services/tax-classes.service';
import { TaxComponentsDomainService } from '@domain/tax-components/services/tax-components.service';
import { TaxGroupsDomainService } from '@domain/tax-groups/services/tax-groups.service';
import { TaxJurisdictionsDomainService } from '@domain/tax-jurisdictions/services/tax-jurisdictions.service';
import { UomDomainService } from '@domain/uom/services/uom.service';
import { UomDimensionsDomainService } from '@domain/uom-dimensions/services/uom-dimensions.service';
import { Controller, Logger } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { type NatsHeaders, RpcNatsHeaders } from '@vritti/api-sdk/nats';
import { SelectOptionsQueryDto, type SelectQueryResult } from '@vritti/api-sdk/select';
import { PartyTypeValues } from '@/db/schema';
import { InventoryItemLotsSelectQueryDto } from './dto/request/inventory-item-lots-select-query.dto';
import { InventoryItemMrpsSelectQueryDto } from './dto/request/inventory-item-mrps-select-query.dto';
import { InventoryItemQuantsSelectQueryDto } from './dto/request/inventory-item-quants-select-query.dto';
import { InventoryItemSerialsSelectQueryDto } from './dto/request/inventory-item-serials-select-query.dto';
import { InventoryItemsSelectQueryDto } from './dto/request/inventory-items-select-query.dto';
import { LocationsSelectQueryDto } from './dto/request/locations-select-query.dto';
import { OfferingVariantsSelectQueryDto } from './dto/request/offering-variants-select-query.dto';
import { OfferingsSelectQueryDto } from './dto/request/offerings-select-query.dto';
import { PartyCommunicationSelectQueryDto } from './dto/request/party-communication-select-query.dto';
import { PartyContactSelectQueryDto } from './dto/request/party-contact-select-query.dto';
import { PartySelectQueryDto } from './dto/request/party-select-query.dto';
import { PartyTaxRegistrationSelectQueryDto } from './dto/request/party-tax-registration-select-query.dto';
import { PaymentTermsSelectQueryDto } from './dto/request/payment-terms-select-query.dto';
import { PurchaseOrderItemsSelectQueryDto } from './dto/request/purchase-order-items-select-query.dto';
import { PurchaseOrdersSelectQueryDto } from './dto/request/purchase-orders-select-query.dto';
import { ReceivablePurchaseOrdersSelectQueryDto } from './dto/request/receivable-purchase-orders-select-query.dto';
import { SupplierItemsSelectQueryDto } from './dto/request/supplier-items-select-query.dto';
import { SuppliersSelectQueryDto } from './dto/request/suppliers-select-query.dto';
import { TaxComponentsSelectQueryDto } from './dto/request/tax-components-select-query.dto';
import { TaxGroupsSelectQueryDto } from './dto/request/tax-groups-select-query.dto';
import { TaxJurisdictionsSelectQueryDto } from './dto/request/tax-jurisdictions-select-query.dto';
import { UomSelectQueryDto } from './dto/request/uom-select-query.dto';

@Controller()
export class SelectController {
  private readonly logger = new Logger(SelectController.name);

  constructor(
    private readonly categoriesService: CategoriesDomainService,
    private readonly inventoryItemsService: InventoryItemsDomainService,
    private readonly attributeTemplatesService: AttributeTemplatesDomainService,
    private readonly dimensionTemplatesService: DimensionTemplatesDomainService,
    private readonly offeringsService: OfferingsDomainService,
    private readonly offeringVariantsService: OfferingVariantsDomainService,
    private readonly uomService: UomDomainService,
    private readonly uomDimensionsService: UomDimensionsDomainService,
    private readonly partiesService: PartiesDomainService,
    private readonly customersService: CustomersDomainService,
    private readonly locationsService: LocationsDomainService,
    private readonly inventoryItemLotsService: InventoryItemLotsDomainService,
    private readonly inventoryItemMrpsService: InventoryItemMrpsDomainService,
    private readonly inventoryItemQuantsService: InventoryItemQuantsDomainService,
    private readonly inventoryItemSerialsService: InventoryItemSerialsDomainService,
    private readonly posTerminalsService: PosTerminalsDomainService,
    private readonly purchaseOrderItemsService: PurchaseOrderItemsDomainService,
    private readonly inboundDeliveryLinesService: InboundDeliveryLinesDomainService,
    private readonly inboundDeliveriesService: InboundDeliveriesDomainService,
    private readonly purchaseOrdersService: PurchaseOrdersDomainService,
    private readonly costCategoriesService: CostCategoriesDomainService,
    private readonly supplierItemsService: SupplierItemsDomainService,
    private readonly suppliersService: SuppliersDomainService,
    private readonly partyCommunicationsService: PartyCommunicationsDomainService,
    private readonly taxClassesService: TaxClassesDomainService,
    private readonly paymentTermsService: PaymentTermsDomainService,
    private readonly taxComponentsService: TaxComponentsDomainService,
    private readonly taxGroupsService: TaxGroupsDomainService,
    private readonly taxJurisdictionsService: TaxJurisdictionsDomainService,
    private readonly partyBankAccountsService: PartyBankAccountsDomainService,
    private readonly partyRelationshipsService: PartyRelationshipsDomainService,
  ) {}

  // Returns paginated category options for the select component
  @MessagePattern({ cmd: 'select.categories' })
  async categories(@Payload() data: CategoriesSelectQueryDto): Promise<SelectQueryResult> {
    this.logger.log('select.categories');
    return this.categoriesService.findForSelect(data);
  }

  // Returns paginated inventory item options for the select component
  @MessagePattern({ cmd: 'select.inventoryItems' })
  async inventoryItems(@Payload() data: InventoryItemsSelectQueryDto): Promise<SelectQueryResult> {
    const { excludeOnSupplierId, ...query } = data;
    this.logger.log('select.inventoryItems');
    return this.inventoryItemsService.findForSelect(query, { excludeOnSupplierId });
  }

  // Returns paginated offering options for the select component
  @MessagePattern({ cmd: 'select.offerings' })
  async offerings(@Payload() query: OfferingsSelectQueryDto): Promise<SelectQueryResult> {
    this.logger.log('select.offerings');
    return this.offeringsService.findForSelect(query);
  }

  // Returns paginated offering variant options for the select component
  @MessagePattern({ cmd: 'select.offeringVariants' })
  async offeringVariants(@Payload() data: OfferingVariantsSelectQueryDto): Promise<SelectQueryResult> {
    this.logger.log(`select.offeringVariants — offeringId: ${data.offeringId ?? 'all'}`);
    return this.offeringVariantsService.findForSelect(data);
  }

  // Returns paginated dimension template options for the select component
  @MessagePattern({ cmd: 'select.dimensionTemplates' })
  async dimensionTemplates(@Payload() query: SelectOptionsQueryDto): Promise<SelectQueryResult> {
    this.logger.log('select.dimensionTemplates');
    return this.dimensionTemplatesService.findForSelect(query);
  }

  @MessagePattern({ cmd: 'select.attributeTemplates' })
  async attributeTemplates(@Payload() query: SelectOptionsQueryDto): Promise<SelectQueryResult> {
    this.logger.log('select.attributeTemplates');
    return this.attributeTemplatesService.findForSelect(query);
  }

  // Returns paginated UOM options for the select component
  @MessagePattern({ cmd: 'select.uom' })
  async uom(@Payload() data: UomSelectQueryDto): Promise<SelectQueryResult> {
    this.logger.log('select.uom');
    return this.uomService.findForSelect(data, {
      derivedOnly: data.derivedOnly,
      baseOnly: data.baseOnly,
      dimensionId: data.dimensionId,
      inventoryItemId: data.inventoryItemId,
      supplierId: data.supplierId,
      purchaseOrderId: data.purchaseOrderId,
    });
  }

  // Returns paginated UOM dimension options for the select component
  @MessagePattern({ cmd: 'select.uomDimensions' })
  async uomDimensions(@Payload() query: SelectOptionsQueryDto): Promise<SelectQueryResult> {
    this.logger.log('select.uomDimensions');
    return this.uomDimensionsService.findForSelect(query);
  }

  // Returns paginated PERSON party options for the people select component
  @MessagePattern({ cmd: 'select.people' })
  async people(@Payload() query: SelectOptionsQueryDto): Promise<SelectQueryResult> {
    this.logger.log('select.people');
    return this.partiesService.findForSelect(query, PartyTypeValues.PERSON);
  }

  // Returns paginated COMPANY party options for the companies select component
  @MessagePattern({ cmd: 'select.companies' })
  async companies(@Payload() query: SelectOptionsQueryDto): Promise<SelectQueryResult> {
    this.logger.log('select.companies');
    return this.partiesService.findForSelect(query, PartyTypeValues.COMPANY);
  }

  // Returns paginated tax registration options of a party for the select component
  @MessagePattern({ cmd: 'select.partyTaxRegistrations' })
  async partyTaxRegistrations(@Payload() data: PartyTaxRegistrationSelectQueryDto): Promise<SelectQueryResult> {
    const { partyId, salesTaxOnly, ...query } = data;
    this.logger.log(`select.partyTaxRegistrations — partyId: ${partyId}, salesTaxOnly: ${salesTaxOnly ?? false}`);
    return this.partiesService.findRegistrationsForSelect(query, partyId, { salesTaxOnly });
  }

  // Returns paginated bank account options of a party for the select component
  @MessagePattern({ cmd: 'select.partyBankAccounts' })
  async partyBankAccounts(@Payload() data: PartySelectQueryDto): Promise<SelectQueryResult> {
    const { partyId, ...query } = data;
    this.logger.log(`select.partyBankAccounts — partyId: ${partyId}`);
    return this.partyBankAccountsService.findForSelect(query, partyId);
  }

  // Returns paginated contact-person (relationship) options of a company party for the select component, optionally
  // filtered to holders of a function (e.g.
  @MessagePattern({ cmd: 'select.partyContacts' })
  async partyContacts(@Payload() data: PartyContactSelectQueryDto): Promise<SelectQueryResult> {
    const { partyId, function: functionCode, ...query } = data;
    this.logger.log(`select.partyContacts — partyId: ${partyId}`);
    return this.partyRelationshipsService.findForSelect(query, partyId, functionCode);
  }

  // Returns paginated active email or phone options of a party, optionally only those holding a function
  @MessagePattern({ cmd: 'select.partyCommunications' })
  async partyCommunications(@Payload() data: PartyCommunicationSelectQueryDto): Promise<SelectQueryResult> {
    const { partyId, channel, function: functionCode, ...query } = data;
    this.logger.log(`select.partyCommunications — partyId: ${partyId}, channel: ${channel}`);
    return this.partyCommunicationsService.findForSelect(query, partyId, channel, functionCode);
  }

  // Returns paginated customer options for the select component
  @MessagePattern({ cmd: 'select.customers' })
  async customers(@Payload() data: SelectOptionsQueryDto): Promise<SelectQueryResult> {
    this.logger.log('select.customers');
    return this.customersService.findForSelect(data);
  }

  // Returns paginated location options for the select component
  @MessagePattern({ cmd: 'select.locations' })
  async locations(@Payload() data: LocationsSelectQueryDto): Promise<SelectQueryResult> {
    this.logger.log(
      `select.locations${data.locationRoles ? ` — locationRoles: ${data.locationRoles}` : ''}${
        data.inventoryItemId ? ` — inventoryItemId: ${data.inventoryItemId}` : ''
      }${data.groupIdKey ? ` — groupIdKey: ${data.groupIdKey}` : ''}`,
    );
    return this.locationsService.findForSelect(data);
  }

  // Returns paginated inventory item lot options for the select component
  @MessagePattern({ cmd: 'select.inventoryItemLots' })
  async inventoryItemLots(@Payload() data: InventoryItemLotsSelectQueryDto): Promise<SelectQueryResult> {
    this.logger.log(`select.inventoryItemLots — inventoryItemId: ${data.inventoryItemId ?? 'all'}`);
    return this.inventoryItemLotsService.findForSelect(data);
  }

  // Returns the MRPs one offering variant could be listed at, found through its bill of materials
  @MessagePattern({ cmd: 'select.inventoryItemMrps' })
  async inventoryItemMrps(@Payload() data: InventoryItemMrpsSelectQueryDto): Promise<SelectQueryResult> {
    this.logger.log(
      `select.inventoryItemMrps — variantId: ${data.variantId}, inventoryItemId: ${data.inventoryItemId}`,
    );
    return this.inventoryItemMrpsService.findForSelect(data);
  }

  // Returns paginated inventory item quant options for the select component
  @MessagePattern({ cmd: 'select.inventoryItemQuants' })
  async inventoryItemQuants(@Payload() data: InventoryItemQuantsSelectQueryDto): Promise<SelectQueryResult> {
    this.logger.log(`select.inventoryItemQuants — inventoryItemId: ${data.inventoryItemId}`);
    return this.inventoryItemQuantsService.findForSelect(data);
  }

  // Returns paginated inventory item serial options for the select component
  @MessagePattern({ cmd: 'select.inventoryItemSerials' })
  async inventoryItemSerials(@Payload() data: InventoryItemSerialsSelectQueryDto): Promise<SelectQueryResult> {
    this.logger.log(`select.inventoryItemSerials — quantId: ${data.quantId ?? 'all'}`);
    return this.inventoryItemSerialsService.findForSelect(data);
  }

  // Returns paginated POS terminal options for the select component
  @MessagePattern({ cmd: 'select.posTerminals' })
  async posTerminals(@Payload() data: SelectOptionsQueryDto): Promise<SelectQueryResult> {
    this.logger.log('select.posTerminals');
    return this.posTerminalsService.findForSelect(data);
  }

  // Returns paginated purchase order item options for the select component
  @MessagePattern({ cmd: 'select.purchaseOrderItems' })
  async purchaseOrderItems(@Payload() data: PurchaseOrderItemsSelectQueryDto): Promise<SelectQueryResult> {
    const { purchaseOrderId, ...query } = data;
    this.logger.log(`select.purchaseOrderItems — poId: ${purchaseOrderId}`);
    return this.purchaseOrderItemsService.findForSelectByPurchaseOrder(purchaseOrderId, query);
  }

  // Returns a supplier's purchase orders a goods receipt can receive, for the receipt's purchase order picker
  @MessagePattern({ cmd: 'select.receivablePurchaseOrders' })
  receivablePurchaseOrders(@Payload() data: ReceivablePurchaseOrdersSelectQueryDto): Promise<SelectQueryResult> {
    const { supplierId, goodsReceiptId, ...query } = data;
    this.logger.log(`select.receivablePurchaseOrders — supplierId: ${supplierId}, receipt: ${goodsReceiptId ?? 'new'}`);
    return this.inboundDeliveryLinesService.findForSelectReceivablePurchaseOrders(supplierId, query, goodsReceiptId);
  }

  // Returns the announced inbound deliveries a goods receipt can be created from
  @MessagePattern({ cmd: 'select.receivableInboundDeliveries' })
  receivableInboundDeliveries(@Payload() data: SelectOptionsQueryDto): Promise<SelectQueryResult> {
    this.logger.log('select.receivableInboundDeliveries');
    return this.inboundDeliveriesService.findForSelectReceivable(data);
  }

  // Returns the open purchase order lines of an inbound delivery's supplier at its site that can still go on it
  @MessagePattern({ cmd: 'select.deliverablePurchaseOrderItems' })
  deliverablePurchaseOrderItems(
    @Payload() data: DeliverablePurchaseOrderItemsSelectQueryDto,
  ): Promise<SelectQueryResult> {
    const { inboundDeliveryId, ...query } = data;
    this.logger.log(`select.deliverablePurchaseOrderItems — inboundDeliveryId: ${inboundDeliveryId}`);
    return this.inboundDeliveryLinesService.findForSelectDeliverable(inboundDeliveryId, query);
  }

  // Returns paginated purchase order options for the select component
  @MessagePattern({ cmd: 'select.purchaseOrders' })
  purchaseOrders(@Payload() data: PurchaseOrdersSelectQueryDto): Promise<SelectQueryResult> {
    this.logger.log('select.purchaseOrders');
    return this.purchaseOrdersService.findForSelect(data);
  }

  // Returns paginated cost category options for the select component
  @MessagePattern({ cmd: 'select.costCategories' })
  async costCategories(@Payload() data: SelectOptionsQueryDto): Promise<SelectQueryResult> {
    this.logger.log('select.costCategories');
    return this.costCategoriesService.findForSelect(data);
  }

  // Returns paginated supplier item options for the select component
  @MessagePattern({ cmd: 'select.supplierItems' })
  async supplierItems(
    @Payload() data: SupplierItemsSelectQueryDto,
    @RpcNatsHeaders() headers: NatsHeaders,
  ): Promise<SelectQueryResult> {
    const { supplierId, purchaseOrderId, excludeOnGoodsReceiptId, ...query } = data;
    this.logger.log(`select.supplierItems — supplierId: ${supplierId ?? 'all'}`);
    return this.supplierItemsService.findForSelect(query, {
      supplierId,
      siteId: headers.siteId || null,
      purchaseOrderId,
      excludeOnGoodsReceiptId,
    });
  }

  // Returns paginated supplier options for the select component
  @MessagePattern({ cmd: 'select.suppliers' })
  async suppliers(@Payload() data: SuppliersSelectQueryDto): Promise<SelectQueryResult> {
    const { activeOnly, inventoryItemId, ...query } = data;
    this.logger.log(`select.suppliers${inventoryItemId ? ` — inventoryItemId: ${inventoryItemId}` : ''}`);
    return this.suppliersService.findForSelect(query, { activeOnly, inventoryItemId });
  }

  // Returns paginated tax class options for the select component
  @MessagePattern({ cmd: 'select.paymentTerms' })
  async paymentTerms(@Payload() data: PaymentTermsSelectQueryDto): Promise<SelectQueryResult> {
    const { allowUnpublished, ...query } = data;
    this.logger.log('select.paymentTerms');
    return this.paymentTermsService.findForSelect(query, { allowUnpublished });
  }

  @MessagePattern({ cmd: 'select.taxClasses' })
  async taxClasses(@Payload() query: SelectOptionsQueryDto): Promise<SelectQueryResult> {
    this.logger.log('select.taxClasses');
    return this.taxClassesService.findForSelect(query);
  }

  // Returns paginated tax component options for the select component, optionally of one country
  @MessagePattern({ cmd: 'select.taxComponents' })
  async taxComponents(@Payload() data: TaxComponentsSelectQueryDto): Promise<SelectQueryResult> {
    const { country, ...query } = data;
    this.logger.log(`select.taxComponents — country: ${country ?? 'all'}`);
    return this.taxComponentsService.findForSelect(query, { country });
  }

  // Returns paginated tax group options for the select component, optionally of one country
  @MessagePattern({ cmd: 'select.taxGroups' })
  async taxGroups(@Payload() data: TaxGroupsSelectQueryDto): Promise<SelectQueryResult> {
    const { country, ...query } = data;
    this.logger.log(`select.taxGroups — country: ${country ?? 'all'}`);
    return this.taxGroupsService.findForSelect(query, { country });
  }

  // Returns paginated tax jurisdiction options for the select component, optionally of one country
  @MessagePattern({ cmd: 'select.taxJurisdictions' })
  async taxJurisdictions(@Payload() data: TaxJurisdictionsSelectQueryDto): Promise<SelectQueryResult> {
    const { country, ...query } = data;
    this.logger.log(`select.taxJurisdictions — country: ${country ?? 'all'}`);
    return this.taxJurisdictionsService.findForSelect(query, { country });
  }
}
