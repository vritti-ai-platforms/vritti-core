import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Logger, Param, Patch, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { RequireSession, UserId } from '@vritti/api-sdk/auth';
import type { CreateResponseDto, SuccessResponseDto } from '@vritti/api-sdk/database';
import { SITE_INVENTORY_ITEMS } from '@vritti/commerce-permissions/inventory-items';
import { SessionTypeValues } from '@/db/schema';
import { RequireFeature } from '@/rbac/decorators';
import { CreateInventoryItemLocationDto } from './dto/request/create-inventory-item-location.dto';
import { EnableInventoryItemDto } from './dto/request/enable-inventory-item.dto';
import { UpdateInventoryItemLocationDto } from './dto/request/update-inventory-item-location.dto';
import { UpdateReorderDto } from './dto/request/update-reorder.dto';
import type { InventoryItemLedgerTableResponseDto } from './dto/response/inventory-item-ledger-table-response.dto';
import type { InventoryItemLocationTableResponseDto } from './dto/response/inventory-item-location-table-response.dto';
import type { InventoryItemLotTableResponseDto } from './dto/response/inventory-item-lot-table-response.dto';
import type { InventoryItemQuantTableResponseDto } from './dto/response/inventory-item-quant-table-response.dto';
import type { InventoryItemResponseDto } from './dto/response/inventory-item-response.dto';
import type { InventoryItemStockResponseDto } from './dto/response/inventory-item-stock-response.dto';
import type { InventoryItemTableResponseDto } from './dto/response/inventory-item-table-response.dto';
import { InventoryItemsGatewayService } from './services/inventory-items-gateway.service';

@ApiTags('Commerce - Inventory Items')
@ApiBearerAuth()
@RequireSession(SessionTypeValues.WEB)
@RequireFeature(SITE_INVENTORY_ITEMS.featureCode)
@Controller('site/inventory-items')
export class InventoryItemsGatewayController {
  private readonly logger = new Logger(InventoryItemsGatewayController.name);

  constructor(private readonly service: InventoryItemsGatewayService) {}

  // Returns paginated inventory items for the data table
  @Get('table')
  getTable(@UserId() userId: string): Promise<InventoryItemTableResponseDto> {
    this.logger.log('GET /commerce-api/site/inventory-items/table');
    return this.service.findForTable(userId);
  }

  // Enables a master inventory item at the current site
  @Post('enable')
  @HttpCode(HttpStatus.CREATED)
  async enable(@Body() dto: EnableInventoryItemDto): Promise<CreateResponseDto<{ id: string }>> {
    this.logger.log('POST /commerce-api/site/inventory-items/enable');
    return this.service.enable(dto);
  }

  // Updates the reorder point for an item at the current site
  @Patch('reorder')
  updateReorder(@Body() dto: UpdateReorderDto): Promise<SuccessResponseDto> {
    this.logger.log('PATCH /commerce-api/site/inventory-items/reorder');
    return this.service.updateReorder(dto);
  }

  // Returns a single inventory item
  @Get(':id')
  findById(@Param('id') id: string): Promise<InventoryItemResponseDto> {
    this.logger.log(`GET /commerce-api/site/inventory-items/${id}`);
    return this.service.findById(id);
  }

  // Returns suppliers carrying this item, table-shaped
  @Get(':id/suppliers/table')
  getSuppliersTable(@Param('id') id: string, @UserId() userId: string) {
    this.logger.log(`GET /commerce-api/site/inventory-items/${id}/suppliers/table`);
    return this.service.findSuppliersTable(id, userId);
  }

  // Returns paginated ledger entries for an inventory item data table
  @Get(':id/ledger/table')
  getLedgerTable(@Param('id') id: string, @UserId() userId: string): Promise<InventoryItemLedgerTableResponseDto> {
    this.logger.log(`GET /commerce-api/site/inventory-items/${id}/ledger/table`);
    return this.service.findLedgerForTable(id, userId);
  }

  // Returns location-wise stock aggregates for an inventory item (sourced from inventory_item_quants)
  @Get(':id/stocks')
  getStocks(@Param('id') id: string): Promise<InventoryItemStockResponseDto[]> {
    this.logger.log(`GET /commerce-api/site/inventory-items/${id}/stocks`);
    return this.service.findStocks(id);
  }

  // Returns paginated quants for an inventory item data table
  @Get(':id/quants/table')
  getQuantsTable(@Param('id') id: string, @UserId() userId: string): Promise<InventoryItemQuantTableResponseDto> {
    this.logger.log(`GET /commerce-api/site/inventory-items/${id}/quants/table`);
    return this.service.findQuantsForTable(id, userId);
  }

  // Returns paginated lots for an inventory item data table
  @Get(':id/lots/table')
  getLotsTable(@Param('id') id: string, @UserId() userId: string): Promise<InventoryItemLotTableResponseDto> {
    this.logger.log(`GET /commerce-api/site/inventory-items/${id}/lots/table`);
    return this.service.findLotsForTable(id, userId);
  }

  // Returns paginated item-location configs for an inventory item
  @Get(':id/locations/table')
  getLocationsTable(@Param('id') id: string, @UserId() userId: string): Promise<InventoryItemLocationTableResponseDto> {
    this.logger.log(`GET /commerce-api/site/inventory-items/${id}/locations/table`);
    return this.service.findItemLocationsForTable(id, userId);
  }

  // Creates an item-location config for an inventory item
  @Post(':id/locations')
  @HttpCode(HttpStatus.CREATED)
  async createLocation(@Param('id') id: string, @Body() dto: CreateInventoryItemLocationDto) {
    this.logger.log(`POST /commerce-api/site/inventory-items/${id}/locations`);
    return this.service.createItemLocation(id, dto);
  }

  // Updates an item-location config
  @Patch(':id/locations/:locationConfigId')
  updateLocation(
    @Param('id') id: string,
    @Param('locationConfigId') locationConfigId: string,
    @Body() dto: UpdateInventoryItemLocationDto,
  ) {
    this.logger.log(`PATCH /commerce-api/site/inventory-items/${id}/locations/${locationConfigId}`);
    return this.service.updateItemLocation(locationConfigId, dto);
  }

  // Deletes an item-location config
  @Delete(':id/locations/:locationConfigId')
  deleteLocation(@Param('id') id: string, @Param('locationConfigId') locationConfigId: string) {
    this.logger.log(`DELETE /commerce-api/site/inventory-items/${id}/locations/${locationConfigId}`);
    return this.service.deleteItemLocation(locationConfigId);
  }
}
