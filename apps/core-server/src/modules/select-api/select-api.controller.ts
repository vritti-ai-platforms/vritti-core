import { Controller, Get, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { RequireSession } from '@vritti/api-sdk/auth';
import { SelectOptionsQueryDto, type SelectQueryResult } from '@vritti/api-sdk/database';
import { NatsClientService } from '@vritti/api-sdk/nats';
import { SessionTypeValues } from '@/db/schema';
import {
  ApiCatalogsSelect,
  ApiCategoriesSelect,
  ApiCostCategoriesSelect,
  ApiCustomersSelect,
  ApiInventoryItemLotsSelect,
  ApiInventoryItemQuantsSelect,
  ApiInventoryItemSerialsSelect,
  ApiInventoryItemsSelect,
  ApiLocationsSelect,
  ApiPosTerminalsSelect,
  ApiPurchaseOrderItemsSelect,
  ApiPurchaseOrdersSelect,
  ApiSalesChannelsSelect,
  ApiSupplierItemsSelect,
  ApiSuppliersSelect,
  ApiTaxGroupsSelect,
  ApiUomDimensionsSelect,
  ApiUomSelect,
} from './docs/select-api.docs';
import { CategoriesSelectQueryDto } from './dto/categories-select-query.dto';
import { InventoryItemsSelectQueryDto } from './dto/inventory-items-select-query.dto';
import { LocationsSelectQueryDto } from './dto/locations-select-query.dto';
import { LotsSelectQueryDto } from './dto/lots-select-query.dto';
import { PurchaseOrderItemsSelectQueryDto } from './dto/purchase-order-items-select-query.dto';
import { PurchaseOrderSelectQueryDto } from './dto/purchase-order-select-query.dto';
import { SerialsSelectQueryDto } from './dto/serials-select-query.dto';
import { SupplierItemsSelectQueryDto } from './dto/supplier-items-select-query.dto';
import { UomSelectQueryDto } from './dto/uom-select-query.dto';

@ApiTags('Commerce - Select')
@ApiBearerAuth()
@RequireSession(SessionTypeValues.WEB, SessionTypeValues.MOBILE)
@Controller('select-api')
export class SelectApiController {
  constructor(private readonly nats: NatsClientService) {}

  @Get('categories')
  @ApiCategoriesSelect()
  selectCategories(@Query() query: CategoriesSelectQueryDto): Promise<SelectQueryResult> {
    return this.nats.send<SelectQueryResult>('commerce', 'categories.select', query);
  }

  @Get('catalogs')
  @ApiCatalogsSelect()
  selectCatalogs(@Query() query: SelectOptionsQueryDto): Promise<SelectQueryResult> {
    return this.nats.send<SelectQueryResult>('commerce', 'catalogs.select', query);
  }

  @Get('cost-categories')
  @ApiCostCategoriesSelect()
  selectCostCategories(@Query() query: SelectOptionsQueryDto): Promise<SelectQueryResult> {
    return this.nats.send<SelectQueryResult>('commerce', 'costCategories.select', query);
  }

  @Get('customers')
  @ApiCustomersSelect()
  selectCustomers(@Query() query: SelectOptionsQueryDto): Promise<SelectQueryResult> {
    return this.nats.send<SelectQueryResult>('commerce', 'customers.select', query);
  }

  @Get('inventory-item-lots')
  @ApiInventoryItemLotsSelect()
  selectInventoryItemLots(@Query() query: LotsSelectQueryDto): Promise<SelectQueryResult> {
    return this.nats.send<SelectQueryResult>('commerce', 'inventoryItems.selectLots', query);
  }

  @Get('inventory-item-quants')
  @ApiInventoryItemQuantsSelect()
  selectInventoryItemQuants(
    @Query() query: SelectOptionsQueryDto & { inventoryItemId: string },
  ): Promise<SelectQueryResult> {
    return this.nats.send<SelectQueryResult>('commerce', 'inventoryItems.selectQuants', query);
  }

  @Get('inventory-item-serials')
  @ApiInventoryItemSerialsSelect()
  selectInventoryItemSerials(@Query() query: SerialsSelectQueryDto): Promise<SelectQueryResult> {
    return this.nats.send<SelectQueryResult>('commerce', 'inventoryItems.selectSerials', query);
  }

  @Get('inventory-items')
  @ApiInventoryItemsSelect()
  selectInventoryItems(@Query() query: InventoryItemsSelectQueryDto): Promise<SelectQueryResult> {
    return this.nats.send<SelectQueryResult>('commerce', 'inventoryItems.select', query);
  }

  @Get('locations')
  @ApiLocationsSelect()
  selectLocations(@Query() query: LocationsSelectQueryDto): Promise<SelectQueryResult> {
    return this.nats.send<SelectQueryResult>('commerce', 'locations.select', query);
  }

  @Get('pos-terminals')
  @ApiPosTerminalsSelect()
  selectPosTerminals(@Query() query: SelectOptionsQueryDto): Promise<SelectQueryResult> {
    return this.nats.send<SelectQueryResult>('commerce', 'posTerminals.select', query);
  }

  @Get('purchase-order-items')
  @ApiPurchaseOrderItemsSelect()
  selectPurchaseOrderItems(@Query() query: PurchaseOrderItemsSelectQueryDto): Promise<SelectQueryResult> {
    return this.nats.send<SelectQueryResult>('commerce', 'purchaseOrderItems.select', query);
  }

  @Get('purchase-orders')
  @ApiPurchaseOrdersSelect()
  selectPurchaseOrders(@Query() query: PurchaseOrderSelectQueryDto): Promise<SelectQueryResult> {
    return this.nats.send<SelectQueryResult>('commerce', 'purchaseOrders.select', query);
  }

  @Get('sales-channels')
  @ApiSalesChannelsSelect()
  selectSalesChannels(@Query() query: SelectOptionsQueryDto): Promise<SelectQueryResult> {
    return this.nats.send<SelectQueryResult>('commerce', 'salesChannels.select', query);
  }

  @Get('supplier-items')
  @ApiSupplierItemsSelect()
  selectSupplierItems(@Query() query: SupplierItemsSelectQueryDto): Promise<SelectQueryResult> {
    return this.nats.send<SelectQueryResult>('commerce', 'supplierItems.select', query);
  }

  @Get('suppliers')
  @ApiSuppliersSelect()
  selectSuppliers(@Query() query: SelectOptionsQueryDto): Promise<SelectQueryResult> {
    return this.nats.send<SelectQueryResult>('commerce', 'suppliers.select', query);
  }

  @Get('tax-groups')
  @ApiTaxGroupsSelect()
  selectTaxGroups(@Query() query: SelectOptionsQueryDto): Promise<SelectQueryResult> {
    return this.nats.send<SelectQueryResult>('commerce', 'taxGroups.select', query);
  }

  @Get('uom')
  @ApiUomSelect()
  selectUom(@Query() query: UomSelectQueryDto): Promise<SelectQueryResult> {
    return this.nats.send<SelectQueryResult>('commerce', 'uom.select', query);
  }

  @Get('uom-dimensions')
  @ApiUomDimensionsSelect()
  selectUomDimensions(@Query() query: SelectOptionsQueryDto): Promise<SelectQueryResult> {
    return this.nats.send<SelectQueryResult>('commerce', 'uom-dimensions.select', query);
  }
}
