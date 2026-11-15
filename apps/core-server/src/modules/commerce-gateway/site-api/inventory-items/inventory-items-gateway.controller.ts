import { CreateInventoryItemLocationDto } from '@commerce/inventory-item-sites/dto/request/create-inventory-item-location.dto';
import { UpdateInventoryItemLocationDto } from '@commerce/inventory-item-sites/dto/request/update-inventory-item-location.dto';
import type { InventoryItemLedgerTableResponseDto } from '@commerce/inventory-item-sites/dto/response/inventory-item-ledger-table-response.dto';
import type { InventoryItemLocationResponseDto } from '@commerce/inventory-item-sites/dto/response/inventory-item-location-response.dto';
import type { InventoryItemLocationTableResponseDto } from '@commerce/inventory-item-sites/dto/response/inventory-item-location-table-response.dto';
import type { InventoryItemLotTableResponseDto } from '@commerce/inventory-item-sites/dto/response/inventory-item-lot-table-response.dto';
import type { InventoryItemQuantTableResponseDto } from '@commerce/inventory-item-sites/dto/response/inventory-item-quant-table-response.dto';
import type { SiteInventoryItemResponseDto } from '@commerce/inventory-item-sites/dto/response/inventory-item-response.dto';
import type { InventoryItemStockResponseDto } from '@commerce/inventory-item-sites/dto/response/inventory-item-stock-response.dto';
import type { SiteStockTableResponseDto } from '@commerce/inventory-item-sites/dto/response/site-stock-table-response.dto';
import { CreateSiteStockLevelsDto } from '@commerce/inventory-items/dto/request/create-site-stock-levels.dto';
import { UpdateSiteStockLevelsDto } from '@commerce/inventory-items/dto/request/update-site-stock-levels.dto';
import type { InventoryItemSiteStockLevelResponseDto } from '@commerce/inventory-items/dto/response/inventory-item-site-stock-level-response.dto';
import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Logger,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AuthType, Require, UserId } from '@vritti/api-sdk/auth';
import type { CreateResponseDto, SuccessResponseDto } from '@vritti/api-sdk/responses';
import { SITE_INVENTORY_ITEMS } from '@vritti/commerce-permissions/inventory-items';
import { SessionTypeValues } from '@/db/schema';
import { RequireFeature, RequirePermission } from '@/rbac/decorators';
import { SiteInventoryItemsGatewayService } from './services/inventory-items-gateway.service';

@ApiTags('Commerce - Inventory Items')
@ApiBearerAuth()
@Require(AuthType.Session, SessionTypeValues.WEB)
@RequireFeature(SITE_INVENTORY_ITEMS.featureCode)
@Controller('site/inventory-items')
export class SiteInventoryItemsGatewayController {
  private readonly logger = new Logger(SiteInventoryItemsGatewayController.name);

  constructor(private readonly service: SiteInventoryItemsGatewayService) {}

  // Every master item with the site's stock levels for it and its stock on hand, split by location
  @Get('stock-table')
  @RequirePermission(SITE_INVENTORY_ITEMS.view)
  getStockTable(@UserId() userId: string): Promise<SiteStockTableResponseDto> {
    this.logger.log('GET /commerce-api/site/inventory-items/stock-table');
    return this.service.findForStockTable(userId);
  }

  // Returns an inventory item's stock levels at the current site, or null while none are set
  @Get(':id/stock-levels')
  @RequirePermission(SITE_INVENTORY_ITEMS.stockLevels.view)
  findStockLevels(
    @Param('id', new ParseUUIDPipe()) id: string,
  ): Promise<InventoryItemSiteStockLevelResponseDto | null> {
    this.logger.log(`GET /commerce-api/site/inventory-items/${id}/stock-levels`);
    return this.service.findStockLevels(id);
  }

  // Sets an inventory item's stock levels at the current site
  @Post(':id/stock-levels')
  @RequirePermission(SITE_INVENTORY_ITEMS.stockLevels.add)
  @HttpCode(HttpStatus.CREATED)
  setStockLevels(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: CreateSiteStockLevelsDto,
  ): Promise<CreateResponseDto<{ id: string }>> {
    this.logger.log(`POST /commerce-api/site/inventory-items/${id}/stock-levels`);
    return this.service.setStockLevels(id, dto);
  }

  // Updates an inventory item's stock levels at the current site
  @Patch(':id/stock-levels')
  @RequirePermission(SITE_INVENTORY_ITEMS.stockLevels.edit)
  updateStockLevels(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateSiteStockLevelsDto,
  ): Promise<SuccessResponseDto> {
    this.logger.log(`PATCH /commerce-api/site/inventory-items/${id}/stock-levels`);
    return this.service.updateStockLevels(id, dto);
  }

  // Removes an inventory item's stock levels at the current site; refused while the site holds it or has it on an open
  // purchase
  @Delete(':id/stock-levels')
  @RequirePermission(SITE_INVENTORY_ITEMS.stockLevels.delete)
  removeStockLevels(@Param('id', new ParseUUIDPipe()) id: string): Promise<SuccessResponseDto> {
    this.logger.log(`DELETE /commerce-api/site/inventory-items/${id}/stock-levels`);
    return this.service.removeStockLevels(id);
  }

  // Returns a single inventory item
  @Get(':id')
  @RequirePermission(SITE_INVENTORY_ITEMS.view)
  findById(@Param('id') id: string): Promise<SiteInventoryItemResponseDto> {
    this.logger.log(`GET /commerce-api/site/inventory-items/${id}`);
    return this.service.findById(id);
  }

  // Returns suppliers carrying this item, table-shaped
  @Get(':id/suppliers/table')
  @RequirePermission(SITE_INVENTORY_ITEMS.view)
  getSuppliersTable(@Param('id') id: string, @UserId() userId: string) {
    this.logger.log(`GET /commerce-api/site/inventory-items/${id}/suppliers/table`);
    return this.service.findSuppliersTable(id, userId);
  }

  // Returns paginated ledger entries for an inventory item data table
  @Get(':id/ledger/table')
  @RequirePermission(SITE_INVENTORY_ITEMS.view)
  getLedgerTable(@Param('id') id: string, @UserId() userId: string): Promise<InventoryItemLedgerTableResponseDto> {
    this.logger.log(`GET /commerce-api/site/inventory-items/${id}/ledger/table`);
    return this.service.findLedgerForTable(id, userId);
  }

  // Returns location-wise stock aggregates for an inventory item (sourced from inventory_item_quants)
  @Get(':id/stocks')
  @RequirePermission(SITE_INVENTORY_ITEMS.view)
  getStocks(@Param('id') id: string): Promise<InventoryItemStockResponseDto[]> {
    this.logger.log(`GET /commerce-api/site/inventory-items/${id}/stocks`);
    return this.service.findStocks(id);
  }

  // Returns paginated quants for an inventory item data table
  @Get(':id/quants/table')
  @RequirePermission(SITE_INVENTORY_ITEMS.view)
  getQuantsTable(@Param('id') id: string, @UserId() userId: string): Promise<InventoryItemQuantTableResponseDto> {
    this.logger.log(`GET /commerce-api/site/inventory-items/${id}/quants/table`);
    return this.service.findQuantsForTable(id, userId);
  }

  // Returns paginated lots for an inventory item data table
  @Get(':id/lots/table')
  @RequirePermission(SITE_INVENTORY_ITEMS.view)
  getLotsTable(@Param('id') id: string, @UserId() userId: string): Promise<InventoryItemLotTableResponseDto> {
    this.logger.log(`GET /commerce-api/site/inventory-items/${id}/lots/table`);
    return this.service.findLotsForTable(id, userId);
  }

  // Returns paginated item-location configs for an inventory item
  @Get(':id/locations/table')
  @RequirePermission(SITE_INVENTORY_ITEMS.locations.view)
  getLocationsTable(@Param('id') id: string, @UserId() userId: string): Promise<InventoryItemLocationTableResponseDto> {
    this.logger.log(`GET /commerce-api/site/inventory-items/${id}/locations/table`);
    return this.service.findItemLocationsForTable(id, userId);
  }

  // Creates an item-location config for an inventory item
  @Post(':id/locations')
  @RequirePermission(SITE_INVENTORY_ITEMS.locations.add)
  @HttpCode(HttpStatus.CREATED)
  createLocation(
    @Param('id') id: string,
    @Body() dto: CreateInventoryItemLocationDto,
  ): Promise<CreateResponseDto<InventoryItemLocationResponseDto>> {
    this.logger.log(`POST /commerce-api/site/inventory-items/${id}/locations`);
    return this.service.createItemLocation(id, dto);
  }

  // Updates an item-location config
  @Patch(':id/locations/:locationConfigId')
  @RequirePermission(SITE_INVENTORY_ITEMS.locations.edit)
  updateLocation(
    @Param('id') id: string,
    @Param('locationConfigId') locationConfigId: string,
    @Body() dto: UpdateInventoryItemLocationDto,
  ): Promise<SuccessResponseDto> {
    this.logger.log(`PATCH /commerce-api/site/inventory-items/${id}/locations/${locationConfigId}`);
    return this.service.updateItemLocation(locationConfigId, dto);
  }

  // Deletes an item-location config
  @Delete(':id/locations/:locationConfigId')
  @RequirePermission(SITE_INVENTORY_ITEMS.locations.delete)
  deleteLocation(
    @Param('id') id: string,
    @Param('locationConfigId') locationConfigId: string,
  ): Promise<SuccessResponseDto> {
    this.logger.log(`DELETE /commerce-api/site/inventory-items/${id}/locations/${locationConfigId}`);
    return this.service.deleteItemLocation(locationConfigId);
  }
}
