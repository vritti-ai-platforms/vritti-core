import type { InventoryItemPriceHistoryResponseDto } from '@commerce/inventory-items/dto/response/inventory-item-price-history-response.dto';
import type { ItemSupplierPriceComparisonTableResponseDto } from '@commerce/inventory-items/dto/response/item-supplier-price-comparison-response.dto';
import { Controller, Get, Logger, Param } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AuthType, Require, UserId } from '@vritti/api-sdk/auth';
import { LE_INVENTORY_ITEMS } from '@vritti/commerce-permissions/inventory-items';
import { SessionTypeValues } from '@/db/schema';
import { RequireFeature, RequirePermission } from '@/rbac/decorators';
import { ApiInventoryItemPricesTable } from './docs/inventory-item-prices-gateway.docs';
import { LeInventoryItemPricesGatewayService } from './services/inventory-item-prices-gateway.service';

@ApiTags('Commerce - LE Inventory Item Prices')
@ApiBearerAuth()
@Require(AuthType.Session, SessionTypeValues.WEB)
@RequireFeature(LE_INVENTORY_ITEMS.featureCode)
@Controller('le/inventory-items/:id/prices')
export class LeInventoryItemPricesGatewayController {
  private readonly logger = new Logger(LeInventoryItemPricesGatewayController.name);

  constructor(private readonly service: LeInventoryItemPricesGatewayService) {}

  // Returns every supplier's standing for the item at the table's context site on its context day: price in force, per
  // primary unit, after scheme
  @Get('table')
  @RequirePermission(LE_INVENTORY_ITEMS.prices.view)
  @ApiInventoryItemPricesTable()
  findTable(@Param('id') id: string, @UserId() userId: string): Promise<ItemSupplierPriceComparisonTableResponseDto> {
    this.logger.log(`GET /commerce-api/le/inventory-items/${id}/prices/table`);
    return this.service.findTable(id, userId);
  }

  // Returns the suppliers' prices the history shows, per its saved selection of site, window, suppliers and MRPs
  @Get('history')
  @RequirePermission(LE_INVENTORY_ITEMS.prices.view)
  findHistory(@Param('id') id: string, @UserId() userId: string): Promise<InventoryItemPriceHistoryResponseDto> {
    this.logger.log(`GET /commerce-api/le/inventory-items/${id}/prices/history`);
    return this.service.findHistory(id, userId);
  }
}
