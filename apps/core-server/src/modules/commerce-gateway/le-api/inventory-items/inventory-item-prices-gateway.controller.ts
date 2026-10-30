import { InventoryItemPriceOptionsQueryDto } from '@commerce/inventory-items/dto/request/inventory-item-price-options-query.dto';
import { InventoryItemPricesTableQueryDto } from '@commerce/inventory-items/dto/request/inventory-item-prices-table-query.dto';
import type { InventoryItemPriceGraphResponseDto } from '@commerce/inventory-items/dto/response/inventory-item-price-history-response.dto';
import type { ItemSupplierPriceComparisonTableResponseDto } from '@commerce/inventory-items/dto/response/item-supplier-price-comparison-response.dto';
import { Controller, Get, Logger, Param, ParseUUIDPipe, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AuthType, Require, UserId } from '@vritti/api-sdk/auth';
import { SelectOptionsQueryDto, type SelectQueryResult } from '@vritti/api-sdk/select';
import { LE_INVENTORY_ITEMS } from '@vritti/commerce-permissions/inventory-items';
import { SessionTypeValues } from '@/db/schema';
import { RequireFeature, RequirePermission } from '@/rbac/decorators';
import { LegalEntityId } from '@/security/decorators';
import { LeInventoryItemPricesGatewayService } from './services/inventory-item-prices-gateway.service';

@ApiTags('Commerce - LE Inventory Item Prices')
@ApiBearerAuth()
@Require(AuthType.Session, SessionTypeValues.WEB)
@RequireFeature(LE_INVENTORY_ITEMS.featureCode)
@Controller('le/inventory-items/:id/prices')
export class LeInventoryItemPricesGatewayController {
  private readonly logger = new Logger(LeInventoryItemPricesGatewayController.name);

  constructor(private readonly service: LeInventoryItemPricesGatewayService) {}

  // Returns every supplier's standing for the item at the table's site: price in force, per primary unit, after scheme
  @Get('table')
  @RequirePermission(LE_INVENTORY_ITEMS.prices.view)
  findTable(
    @Param('id') id: string,
    @LegalEntityId() legalEntityId: string | undefined,
    @UserId() userId: string,
    @Query() query: InventoryItemPricesTableQueryDto,
  ): Promise<ItemSupplierPriceComparisonTableResponseDto> {
    this.logger.log(`GET /commerce-api/le/inventory-items/${id}/prices/table`);
    return this.service.findTable(id, legalEntityId, userId, query);
  }

  // Returns the suppliers' prices the graph shows, per its saved selection of site, window, suppliers and MRPs
  @Get('graph')
  @RequirePermission(LE_INVENTORY_ITEMS.prices.view)
  findGraph(
    @Param('id') id: string,
    @LegalEntityId() legalEntityId: string | undefined,
    @UserId() userId: string,
  ): Promise<InventoryItemPriceGraphResponseDto> {
    this.logger.log(`GET /commerce-api/le/inventory-items/${id}/prices/graph`);
    return this.service.findGraph(id, legalEntityId, userId);
  }

  // Returns the legal entity's sites where any supplier has priced the item, as select options
  @Get('sites')
  @RequirePermission(LE_INVENTORY_ITEMS.prices.view)
  findSites(
    @Param('id') id: string,
    @LegalEntityId() legalEntityId: string | undefined,
    @Query() query: SelectOptionsQueryDto,
  ): Promise<SelectQueryResult> {
    this.logger.log(`GET /commerce-api/le/inventory-items/${id}/prices/sites`);
    return this.service.findSitesForSelect(id, legalEntityId, query);
  }

  // Returns the item's MRPs that supplier prices at one site were agreed against within a window, as select options
  @Get(':siteId/mrps')
  @RequirePermission(LE_INVENTORY_ITEMS.mrp.view)
  findMrps(
    @Param('id') id: string,
    @Param('siteId', new ParseUUIDPipe()) siteId: string,
    @Query() query: InventoryItemPriceOptionsQueryDto,
  ): Promise<SelectQueryResult> {
    this.logger.log(`GET /commerce-api/le/inventory-items/${id}/prices/${siteId}/mrps`);
    return this.service.findMrps(id, siteId, query);
  }

  // Returns the suppliers with a price for the item at one site within a window, as select options
  @Get(':siteId/suppliers')
  @RequirePermission(LE_INVENTORY_ITEMS.prices.view)
  findSuppliers(
    @Param('id') id: string,
    @Param('siteId', new ParseUUIDPipe()) siteId: string,
    @Query() query: InventoryItemPriceOptionsQueryDto,
  ): Promise<SelectQueryResult> {
    this.logger.log(`GET /commerce-api/le/inventory-items/${id}/prices/${siteId}/suppliers`);
    return this.service.findSuppliers(id, siteId, query);
  }
}
