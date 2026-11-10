import type { InventoryItemPriceHistoryResponseDto } from '@commerce/inventory-items/dto/response/inventory-item-price-history-response.dto';
import type { ItemSupplierPriceTableResponseDto } from '@commerce/supplier-item-prices/dto/response/item-supplier-price-table-response.dto';
import { Controller, Get, Logger, Param } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AuthType, Require, UserId } from '@vritti/api-sdk/auth';
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

  // Returns the suppliers' prices the history shows, per its saved selection of window, suppliers and MRPs
  @Get('history')
  @RequirePermission(SITE_INVENTORY_ITEMS.prices.view)
  findHistory(@Param('id') id: string, @UserId() userId: string): Promise<InventoryItemPriceHistoryResponseDto> {
    this.logger.log(`GET /commerce-api/site/inventory-items/${id}/prices/history`);
    return this.service.findHistory(id, userId);
  }
}
