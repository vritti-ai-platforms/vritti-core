import { CatalogsDomainService } from '@domain/catalogs/services/catalogs.service';
import { CategoriesSelectQueryDto } from '@domain/categories/dto/request/categories-select-query.dto';
import { CategoriesDomainService } from '@domain/categories/services/categories.service';
import { CostCategoriesDomainService } from '@domain/cost-categories/services/cost-categories.service';
import { CustomersDomainService } from '@domain/customers/services/customers.service';
import { InventoryItemLotsDomainService } from '@domain/inventory-item-lots/services/inventory-item-lots.service';
import { InventoryItemQuantsDomainService } from '@domain/inventory-item-quants/services/inventory-item-quants.service';
import { InventoryItemSerialsDomainService } from '@domain/inventory-item-serials/services/inventory-item-serials.service';
import { InventoryItemsDomainService } from '@domain/inventory-items/services/inventory-items.service';
import { LocationsDomainService } from '@domain/locations/services/locations.service';
import { PartiesDomainService } from '@domain/parties/services/parties.service';
import { PartyBankAccountsDomainService } from '@domain/party-bank-accounts/services/party-bank-accounts.service';
import { PartyRelationshipsDomainService } from '@domain/party-relationships/services/party-relationships.service';
import { PosTerminalsDomainService } from '@domain/pos-terminals/services/pos-terminals.service';
import { PurchaseOrderItemsDomainService } from '@domain/purchase-order-items/services/purchase-order-items.service';
import { PurchaseOrdersDomainService } from '@domain/purchase-orders/services/purchase-orders.service';
import { SalesChannelsDomainService } from '@domain/sales-channels/services/sales-channels.service';
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
import { SelectOptionsQueryDto, type SelectQueryResult } from '@vritti/api-sdk/database';
import { PartyTypeValues } from '@/db/schema';
import { InventoryItemLotsSelectQueryDto } from './dto/request/inventory-item-lots-select-query.dto';
import { InventoryItemQuantsSelectQueryDto } from './dto/request/inventory-item-quants-select-query.dto';
import { InventoryItemSerialsSelectQueryDto } from './dto/request/inventory-item-serials-select-query.dto';
import { InventoryItemsSelectQueryDto } from './dto/request/inventory-items-select-query.dto';
import { LocationsSelectQueryDto } from './dto/request/locations-select-query.dto';
import { PartyContactSelectQueryDto } from './dto/request/party-contact-select-query.dto';
import { PartySelectQueryDto } from './dto/request/party-select-query.dto';
import { PurchaseOrderItemsSelectQueryDto } from './dto/request/purchase-order-items-select-query.dto';
import { PurchaseOrdersSelectQueryDto } from './dto/request/purchase-orders-select-query.dto';
import { SupplierItemsSelectQueryDto } from './dto/request/supplier-items-select-query.dto';
import { SuppliersSelectQueryDto } from './dto/request/suppliers-select-query.dto';
import { UomSelectQueryDto } from './dto/request/uom-select-query.dto';

@Controller()
export class SelectController {
  private readonly logger = new Logger(SelectController.name);

  constructor(
    private readonly categoriesService: CategoriesDomainService,
    private readonly inventoryItemsService: InventoryItemsDomainService,
    private readonly salesChannelsService: SalesChannelsDomainService,
    private readonly uomService: UomDomainService,
    private readonly uomDimensionsService: UomDimensionsDomainService,
    private readonly catalogsService: CatalogsDomainService,
    private readonly partiesService: PartiesDomainService,
    private readonly customersService: CustomersDomainService,
    private readonly locationsService: LocationsDomainService,
    private readonly inventoryItemLotsService: InventoryItemLotsDomainService,
    private readonly inventoryItemQuantsService: InventoryItemQuantsDomainService,
    private readonly inventoryItemSerialsService: InventoryItemSerialsDomainService,
    private readonly posTerminalsService: PosTerminalsDomainService,
    private readonly purchaseOrderItemsService: PurchaseOrderItemsDomainService,
    private readonly purchaseOrdersService: PurchaseOrdersDomainService,
    private readonly costCategoriesService: CostCategoriesDomainService,
    private readonly supplierItemsService: SupplierItemsDomainService,
    private readonly suppliersService: SuppliersDomainService,
    private readonly taxClassesService: TaxClassesDomainService,
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

  // Returns paginated sales channel options for the select component
  @MessagePattern({ cmd: 'select.salesChannels' })
  async salesChannels(@Payload() data: SelectOptionsQueryDto): Promise<SelectQueryResult> {
    this.logger.log('select.salesChannels');
    return this.salesChannelsService.findForSelect(data);
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

  // Returns paginated catalog options for the select component
  @MessagePattern({ cmd: 'select.catalogs' })
  async catalogs(@Payload() data: SelectOptionsQueryDto): Promise<SelectQueryResult> {
    this.logger.log('select.catalogs');
    return this.catalogsService.findForSelect(data);
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
  async partyTaxRegistrations(@Payload() data: PartySelectQueryDto): Promise<SelectQueryResult> {
    const { partyId, ...query } = data;
    this.logger.log(`select.partyTaxRegistrations — partyId: ${partyId}`);
    return this.partiesService.findRegistrationsForSelect(query, partyId);
  }

  // Returns paginated bank account options of a party for the select component
  @MessagePattern({ cmd: 'select.partyBankAccounts' })
  async partyBankAccounts(@Payload() data: PartySelectQueryDto): Promise<SelectQueryResult> {
    const { partyId, ...query } = data;
    this.logger.log(`select.partyBankAccounts — partyId: ${partyId}`);
    return this.partyBankAccountsService.findForSelect(query, partyId);
  }

  // Returns paginated contact-person (relationship) options of a company party for the select component,
  // optionally filtered to holders of a function (e.g. ORDER for the order-contact picker)
  @MessagePattern({ cmd: 'select.partyContacts' })
  async partyContacts(@Payload() data: PartyContactSelectQueryDto): Promise<SelectQueryResult> {
    const { partyId, function: functionCode, ...query } = data;
    this.logger.log(`select.partyContacts — partyId: ${partyId}`);
    return this.partyRelationshipsService.findForSelect(query, partyId, functionCode);
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
    const { purchaseOrderId, excludeOnGoodsReceiptId, ...query } = data;
    this.logger.log(`select.purchaseOrderItems — poId: ${purchaseOrderId}`);
    return this.purchaseOrderItemsService.findForSelectByPo(purchaseOrderId, query, { excludeOnGoodsReceiptId });
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
  async supplierItems(@Payload() data: SupplierItemsSelectQueryDto): Promise<SelectQueryResult> {
    const { supplierId, excludeOnPurchaseOrderId, excludeOnGoodsReceiptId, ...query } = data;
    this.logger.log(`select.supplierItems — supplierId: ${supplierId ?? 'all'}`);
    return this.supplierItemsService.findForSelect(query, {
      supplierId,
      excludeOnPurchaseOrderId,
      excludeOnGoodsReceiptId,
    });
  }

  // Returns paginated supplier options for the select component
  @MessagePattern({ cmd: 'select.suppliers' })
  async suppliers(@Payload() data: SuppliersSelectQueryDto): Promise<SelectQueryResult> {
    const { enrollable, ...query } = data;
    this.logger.log('select.suppliers');
    return this.suppliersService.findForSelect(query, { enrollable });
  }

  // Returns paginated tax class options for the select component
  @MessagePattern({ cmd: 'select.taxClasses' })
  async taxClasses(@Payload() query: SelectOptionsQueryDto): Promise<SelectQueryResult> {
    this.logger.log('select.taxClasses');
    return this.taxClassesService.findForSelect(query);
  }

  // Returns paginated tax component options for the select component
  @MessagePattern({ cmd: 'select.taxComponents' })
  async taxComponents(@Payload() query: SelectOptionsQueryDto): Promise<SelectQueryResult> {
    this.logger.log('select.taxComponents');
    return this.taxComponentsService.findForSelect(query);
  }

  // Returns paginated tax group options for the select component
  @MessagePattern({ cmd: 'select.taxGroups' })
  async taxGroups(@Payload() query: SelectOptionsQueryDto): Promise<SelectQueryResult> {
    this.logger.log('select.taxGroups');
    return this.taxGroupsService.findForSelect(query);
  }

  // Returns paginated tax jurisdiction options for the select component
  @MessagePattern({ cmd: 'select.taxJurisdictions' })
  async taxJurisdictions(@Payload() query: SelectOptionsQueryDto): Promise<SelectQueryResult> {
    this.logger.log('select.taxJurisdictions');
    return this.taxJurisdictionsService.findForSelect(query);
  }
}
