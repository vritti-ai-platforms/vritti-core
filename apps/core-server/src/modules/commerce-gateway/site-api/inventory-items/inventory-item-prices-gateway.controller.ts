import { InventoryItemPriceOptionsQueryDto } from '@commerce/inventory-items/dto/request/inventory-item-price-options-query.dto';
import type { InventoryItemPriceGraphResponseDto } from '@commerce/inventory-items/dto/response/inventory-item-price-history-response.dto';
import type { ItemSupplierPriceTableResponseDto } from '@commerce/supplier-item-prices/dto/response/item-supplier-price-table-response.dto';
import { Controller, Get, Logger, Param, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AuthType, Require, UserId } from '@vritti/api-sdk/auth';
import type { SelectQueryResult } from '@vritti/api-sdk/select';
import { SITE_INVENTORY_ITEMS } from '@vritti/commerce-permissions/inventory-items';
import { SessionTypeValues } from '@/db/schema';
import { RequireFeature, RequirePermission } from '@/rbac/decorators';
import { SiteInventoryItemPricesGatewayService } from './services/inventory-item-prices-gateway.service';

@ApiTags('Commerce - Site Inventory Item Prices')
@ApiBearerAuth()
@Require(AuthType.Session, SessionTypeValues.WEB)
@RequireFeature(SITE_INVENTORY_ITEMS.featureCode)
@Controller('site/inventory-items/:id/prices')
export class SiteInventoryItemPricesGatewayController {
  private readonly logger = new Logger(SiteInventoryItemPricesGatewayController.name);

  constructor(private readonly service: SiteInventoryItemPricesGatewayService) {}

  // Returns every supplier's price rows for the item at this site
  @Get('table')
  @RequirePermission(SITE_INVENTORY_ITEMS.prices.view)
  findTable(@Param('id') id: string, @UserId() userId: string): Promise<ItemSupplierPriceTableResponseDto> {
    this.logger.log(`GET /commerce-api/site/inventory-items/${id}/prices/table`);
    return this.service.findTable(id, userId);
  }

  // Returns the item's MRPs that supplier prices at this site were agreed against within a window, as select options
  @Get('mrps')
  @RequirePermission(SITE_INVENTORY_ITEMS.mrp.view)
  findMrps(@Param('id') id: string, @Query() query: InventoryItemPriceOptionsQueryDto): Promise<SelectQueryResult> {
    this.logger.log(`GET /commerce-api/site/inventory-items/${id}/prices/mrps`);
    return this.service.findMrps(id, query);
  }

  // Returns the suppliers with a price for the item at this site within a window, as select options
  @Get('suppliers')
  @RequirePermission(SITE_INVENTORY_ITEMS.prices.view)
  findSuppliers(
    @Param('id') id: string,
    @Query() query: InventoryItemPriceOptionsQueryDto,
  ): Promise<SelectQueryResult> {
    this.logger.log(`GET /commerce-api/site/inventory-items/${id}/prices/suppliers`);
    return this.service.findSuppliers(id, query);
  }

  // Returns the suppliers' prices the graph shows, per its saved selection of window, suppliers and MRPs
  @Get('graph')
  @RequirePermission(SITE_INVENTORY_ITEMS.prices.view)
  findGraph(@Param('id') id: string, @UserId() userId: string): Promise<InventoryItemPriceGraphResponseDto> {
    this.logger.log(`GET /commerce-api/site/inventory-items/${id}/prices/graph`);
    return this.service.findGraph(id, userId);
  }
}
