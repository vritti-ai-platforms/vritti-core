import { BlockSiteItemDto } from '@commerce/inventory-item-sites/dto/request/block-site-item.dto';
import { CreateInventoryItemLocationDto } from '@commerce/inventory-item-sites/dto/request/create-inventory-item-location.dto';
import { ReplenishmentDto } from '@commerce/inventory-item-sites/dto/request/replenishment.dto';
import { UpdateInventoryItemLocationDto } from '@commerce/inventory-item-sites/dto/request/update-inventory-item-location.dto';
import type { InventoryItemLedgerTableResponseDto } from '@commerce/inventory-item-sites/dto/response/inventory-item-ledger-table-response.dto';
import type { InventoryItemLocationResponseDto } from '@commerce/inventory-item-sites/dto/response/inventory-item-location-response.dto';
import type { InventoryItemLocationTableResponseDto } from '@commerce/inventory-item-sites/dto/response/inventory-item-location-table-response.dto';
import type { InventoryItemLotTableResponseDto } from '@commerce/inventory-item-sites/dto/response/inventory-item-lot-table-response.dto';
import type { InventoryItemQuantTableResponseDto } from '@commerce/inventory-item-sites/dto/response/inventory-item-quant-table-response.dto';
import type { SiteInventoryItemResponseDto } from '@commerce/inventory-item-sites/dto/response/inventory-item-response.dto';
import type { InventoryItemSiteResponseDto } from '@commerce/inventory-item-sites/dto/response/inventory-item-site-response.dto';
import type { InventoryItemStockResponseDto } from '@commerce/inventory-item-sites/dto/response/inventory-item-stock-response.dto';
import type { SiteStockTableResponseDto } from '@commerce/inventory-item-sites/dto/response/site-stock-table-response.dto';
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

  // Adds an inventory item to the current site with how it is replenished here
  @Post(':id/setup')
  @RequirePermission(SITE_INVENTORY_ITEMS.setup.add)
  @HttpCode(HttpStatus.CREATED)
  addToSite(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: ReplenishmentDto,
  ): Promise<CreateResponseDto<InventoryItemSiteResponseDto>> {
    this.logger.log(`POST /commerce-api/site/inventory-items/${id}/setup`);
    return this.service.addToSite(id, dto);
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

  // Changes how the current site replenishes an inventory item
  @Patch(':id/setup')
  @RequirePermission(SITE_INVENTORY_ITEMS.setup.edit)
  updateReplenishment(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: ReplenishmentDto,
  ): Promise<SuccessResponseDto> {
    this.logger.log(`PATCH /commerce-api/site/inventory-items/${id}/setup`);
    return this.service.updateReplenishment(id, dto);
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

  // Stops the current site buying an inventory item, with why
  @Post(':id/setup/block')
  @RequirePermission(SITE_INVENTORY_ITEMS.setup.block)
  @HttpCode(HttpStatus.OK)
  block(@Param('id', new ParseUUIDPipe()) id: string, @Body() dto: BlockSiteItemDto): Promise<SuccessResponseDto> {
    this.logger.log(`POST /commerce-api/site/inventory-items/${id}/setup/block`);
    return this.service.block(id, dto);
  }

  // Lets the current site buy an inventory item again
  @Post(':id/setup/unblock')
  @RequirePermission(SITE_INVENTORY_ITEMS.setup.block)
  @HttpCode(HttpStatus.OK)
  unblock(@Param('id', new ParseUUIDPipe()) id: string): Promise<SuccessResponseDto> {
    this.logger.log(`POST /commerce-api/site/inventory-items/${id}/setup/unblock`);
    return this.service.unblock(id);
  }

  // Returns a single inventory item
  @Get(':id')
  @RequirePermission(SITE_INVENTORY_ITEMS.view)
  findById(@Param('id') id: string): Promise<SiteInventoryItemResponseDto> {
    this.logger.log(`GET /commerce-api/site/inventory-items/${id}`);
    return this.service.findById(id);
  }

  // Every master item with how the site carries it and its stock on hand, split by location
  @Get('stock-table')
  @RequirePermission(SITE_INVENTORY_ITEMS.view)
  getStockTable(@UserId() userId: string): Promise<SiteStockTableResponseDto> {
    this.logger.log('GET /commerce-api/site/inventory-items/stock-table');
    return this.service.findForStockTable(userId);
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

  // Returns how the current site carries an inventory item, or null while it does not
  @Get(':id/setup')
  @RequirePermission(SITE_INVENTORY_ITEMS.setup.view)
  findSiteItem(@Param('id', new ParseUUIDPipe()) id: string): Promise<InventoryItemSiteResponseDto | null> {
    this.logger.log(`GET /commerce-api/site/inventory-items/${id}/setup`);
    return this.service.findSiteItem(id);
  }

  // Returns location-wise stock aggregates for an inventory item (sourced from inventory_item_quants)
  @Get(':id/stocks')
  @RequirePermission(SITE_INVENTORY_ITEMS.view)
  getStocks(@Param('id') id: string): Promise<InventoryItemStockResponseDto[]> {
    this.logger.log(`GET /commerce-api/site/inventory-items/${id}/stocks`);
    return this.service.findStocks(id);
  }

  // Removes an inventory item from the current site; refused while the site holds it or has it on an open purchase
  @Delete(':id/setup')
  @RequirePermission(SITE_INVENTORY_ITEMS.setup.delete)
  removeFromSite(@Param('id', new ParseUUIDPipe()) id: string): Promise<SuccessResponseDto> {
    this.logger.log(`DELETE /commerce-api/site/inventory-items/${id}/setup`);
    return this.service.removeFromSite(id);
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
