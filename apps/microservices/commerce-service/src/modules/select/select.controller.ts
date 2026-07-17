import { CatalogsService } from '@domain/catalogs/services/catalogs.service';
import { CategoriesService } from '@domain/categories/services/categories.service';
import { CostCategoriesService } from '@domain/cost-categories/services/cost-categories.service';
import { CustomersService } from '@domain/customers/services/customers.service';
import { InventoryItemLotsService } from '@domain/inventory-item-lots/services/inventory-item-lots.service';
import { InventoryItemQuantsService } from '@domain/inventory-item-quants/services/inventory-item-quants.service';
import { InventoryItemSerialsService } from '@domain/inventory-item-serials/services/inventory-item-serials.service';
import { InventoryItemsService } from '@domain/inventory-items/services/inventory-items.service';
import { LocationsService } from '@domain/locations/services/locations.service';
import { PartiesService } from '@domain/parties/services/parties.service';
import { PosTerminalsService } from '@domain/pos-terminals/services/pos-terminals.service';
import { PurchaseOrderItemsService } from '@domain/purchase-order-items/services/purchase-order-items.service';
import { PurchaseOrdersService } from '@domain/purchase-orders/services/purchase-orders.service';
import { SalesChannelsService } from '@domain/sales-channels/services/sales-channels.service';
import { SupplierItemsService } from '@domain/supplier-items/services/supplier-items.service';
import { SuppliersService } from '@domain/suppliers/services/suppliers.service';
import { TaxClassesService } from '@domain/tax-classes/services/tax-classes.service';
import { TaxComponentsService } from '@domain/tax-components/services/tax-components.service';
import { TaxGroupsService } from '@domain/tax-groups/services/tax-groups.service';
import { TaxJurisdictionsService } from '@domain/tax-jurisdictions/services/tax-jurisdictions.service';
import { UomService } from '@domain/uom/services/uom.service';
import { UomDimensionsService } from '@domain/uom-dimensions/services/uom-dimensions.service';
import { Controller, Logger } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { SelectOptionsQueryDto, type SelectQueryResult } from '@vritti/api-sdk/database';
import { PartyTypeValues } from '@/db/schema';
import { CategoriesSelectQueryDto } from '@/modules/organization/categories/root/dto/request/categories-select-query.dto';
import { InventoryItemLotsSelectQueryDto } from './dto/request/inventory-item-lots-select-query.dto';
import { InventoryItemQuantsSelectQueryDto } from './dto/request/inventory-item-quants-select-query.dto';
import { InventoryItemSerialsSelectQueryDto } from './dto/request/inventory-item-serials-select-query.dto';
import { InventoryItemsSelectQueryDto } from './dto/request/inventory-items-select-query.dto';
import { LocationsSelectQueryDto } from './dto/request/locations-select-query.dto';
import { PurchaseOrderItemsSelectQueryDto } from './dto/request/purchase-order-items-select-query.dto';
import { PurchaseOrdersSelectQueryDto } from './dto/request/purchase-orders-select-query.dto';
import { SupplierItemsSelectQueryDto } from './dto/request/supplier-items-select-query.dto';
import { UomSelectQueryDto } from './dto/request/uom-select-query.dto';

@Controller()
export class SelectController {
  private readonly logger = new Logger(SelectController.name);

  constructor(
    private readonly categoriesService: CategoriesService,
    private readonly inventoryItemsService: InventoryItemsService,
    private readonly salesChannelsService: SalesChannelsService,
    private readonly uomService: UomService,
    private readonly uomDimensionsService: UomDimensionsService,
    private readonly catalogsService: CatalogsService,
    private readonly partiesService: PartiesService,
    private readonly customersService: CustomersService,
    private readonly locationsService: LocationsService,
    private readonly inventoryItemLotsService: InventoryItemLotsService,
    private readonly inventoryItemQuantsService: InventoryItemQuantsService,
    private readonly inventoryItemSerialsService: InventoryItemSerialsService,
    private readonly posTerminalsService: PosTerminalsService,
    private readonly purchaseOrderItemsService: PurchaseOrderItemsService,
    private readonly purchaseOrdersService: PurchaseOrdersService,
    private readonly costCategoriesService: CostCategoriesService,
    private readonly supplierItemsService: SupplierItemsService,
    private readonly suppliersService: SuppliersService,
    private readonly taxClassesService: TaxClassesService,
    private readonly taxComponentsService: TaxComponentsService,
    private readonly taxGroupsService: TaxGroupsService,
    private readonly taxJurisdictionsService: TaxJurisdictionsService,
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

  // Returns paginated ORGANIZATION party options for the companies select component
  @MessagePattern({ cmd: 'select.companies' })
  async companies(@Payload() query: SelectOptionsQueryDto): Promise<SelectQueryResult> {
    this.logger.log('select.companies');
    return this.partiesService.findForSelect(query, PartyTypeValues.ORGANIZATION);
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
  async suppliers(@Payload() data: SelectOptionsQueryDto): Promise<SelectQueryResult> {
    this.logger.log('select.suppliers');
    return this.suppliersService.findForSelect(data);
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
