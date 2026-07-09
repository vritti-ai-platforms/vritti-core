import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Logger, Param, Patch, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { RequireSession, UserId } from '@vritti/api-sdk/auth';
import type { CreateResponseDto, SuccessResponseDto } from '@vritti/api-sdk/database';
import { SessionTypeValues } from '@/db/schema';
import { CreateInventoryItemDto } from './dto/request/create-inventory-item.dto';
import { CreateInventoryItemLocationDto } from './dto/request/create-inventory-item-location.dto';
import { CreateInventoryItemUomConversionDto } from './dto/request/create-inventory-item-uom-conversion.dto';
import { UpdateInventoryItemDto } from './dto/request/update-inventory-item.dto';
import { UpdateInventoryItemLocationDto } from './dto/request/update-inventory-item-location.dto';
import { UpdateInventoryItemUomConversionDto } from './dto/request/update-inventory-item-uom-conversion.dto';
import type { InventoryItemLedgerTableResponseDto } from './dto/response/inventory-item-ledger-table-response.dto';
import type { InventoryItemLocationTableResponseDto } from './dto/response/inventory-item-location-table-response.dto';
import type { InventoryItemLotTableResponseDto } from './dto/response/inventory-item-lot-table-response.dto';
import type { InventoryItemQuantTableResponseDto } from './dto/response/inventory-item-quant-table-response.dto';
import type { InventoryItemResponseDto } from './dto/response/inventory-item-response.dto';
import type { InventoryItemStockResponseDto } from './dto/response/inventory-item-stock-response.dto';
import type { InventoryItemTableResponseDto } from './dto/response/inventory-item-table-response.dto';
import type { InventoryItemUomConversionResponseDto } from './dto/response/inventory-item-uom-conversion-response.dto';
import { InventoryItemsGatewayService } from './services/inventory-items-gateway.service';

@ApiTags('Commerce - Inventory Items')
@ApiBearerAuth()
@RequireSession(SessionTypeValues.WEB)
@Controller('inventory-items')
export class InventoryItemsGatewayController {
  private readonly logger = new Logger(InventoryItemsGatewayController.name);

  constructor(private readonly service: InventoryItemsGatewayService) {}

  // Returns paginated inventory items for the data table
  @Get('table')
  getTable(@UserId() userId: string): Promise<InventoryItemTableResponseDto> {
    this.logger.log('GET /commerce-api/inventory-items/table');
    return this.service.findForTable(userId);
  }

  // Creates a new inventory item
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() dto: CreateInventoryItemDto): Promise<CreateResponseDto<InventoryItemResponseDto>> {
    this.logger.log('POST /commerce-api/inventory-items');
    return this.service.create(dto);
  }

  // Returns a single inventory item
  @Get(':id')
  findById(@Param('id') id: string): Promise<InventoryItemResponseDto> {
    this.logger.log(`GET /commerce-api/inventory-items/${id}`);
    return this.service.findById(id);
  }

  // Returns suppliers carrying this item, table-shaped
  @Get(':id/suppliers/table')
  getSuppliersTable(@Param('id') id: string, @UserId() userId: string) {
    this.logger.log(`GET /commerce-api/inventory-items/${id}/suppliers/table`);
    return this.service.findSuppliersTable(id, userId);
  }

  // Returns paginated ledger entries for an inventory item data table
  @Get(':id/ledger/table')
  getLedgerTable(@Param('id') id: string, @UserId() userId: string): Promise<InventoryItemLedgerTableResponseDto> {
    this.logger.log(`GET /commerce-api/inventory-items/${id}/ledger/table`);
    return this.service.findLedgerForTable(id, userId);
  }

  // Returns location-wise stock aggregates for an inventory item (sourced from inventory_item_quants)
  @Get(':id/stocks')
  getStocks(@Param('id') id: string): Promise<InventoryItemStockResponseDto[]> {
    this.logger.log(`GET /commerce-api/inventory-items/${id}/stocks`);
    return this.service.findStocks(id);
  }

  // Returns paginated quants for an inventory item data table
  @Get(':id/quants/table')
  getQuantsTable(@Param('id') id: string, @UserId() userId: string): Promise<InventoryItemQuantTableResponseDto> {
    this.logger.log(`GET /commerce-api/inventory-items/${id}/quants/table`);
    return this.service.findQuantsForTable(id, userId);
  }

  // Returns paginated lots for an inventory item data table
  @Get(':id/lots/table')
  getLotsTable(@Param('id') id: string, @UserId() userId: string): Promise<InventoryItemLotTableResponseDto> {
    this.logger.log(`GET /commerce-api/inventory-items/${id}/lots/table`);
    return this.service.findLotsForTable(id, userId);
  }

  // Returns paginated item-location configs for an inventory item
  @Get(':id/locations/table')
  getLocationsTable(@Param('id') id: string, @UserId() userId: string): Promise<InventoryItemLocationTableResponseDto> {
    this.logger.log(`GET /commerce-api/inventory-items/${id}/locations/table`);
    return this.service.findItemLocationsForTable(id, userId);
  }

  // Creates an item-location config for an inventory item
  @Post(':id/locations')
  @HttpCode(HttpStatus.CREATED)
  async createLocation(@Param('id') id: string, @Body() dto: CreateInventoryItemLocationDto) {
    this.logger.log(`POST /commerce-api/inventory-items/${id}/locations`);
    return this.service.createItemLocation(id, dto);
  }

  // Updates an item-location config
  @Patch(':id/locations/:locationConfigId')
  updateLocation(
    @Param('id') id: string,
    @Param('locationConfigId') locationConfigId: string,
    @Body() dto: UpdateInventoryItemLocationDto,
  ) {
    this.logger.log(`PATCH /commerce-api/inventory-items/${id}/locations/${locationConfigId}`);
    return this.service.updateItemLocation(locationConfigId, dto);
  }

  // Deletes an item-location config
  @Delete(':id/locations/:locationConfigId')
  deleteLocation(@Param('id') id: string, @Param('locationConfigId') locationConfigId: string) {
    this.logger.log(`DELETE /commerce-api/inventory-items/${id}/locations/${locationConfigId}`);
    return this.service.deleteItemLocation(locationConfigId);
  }

  // Returns paginated UOM conversion overrides for an inventory item
  @Get(':id/uom-conversions/table')
  getUomConversionsTable(@Param('id') id: string, @UserId() userId: string) {
    this.logger.log(`GET /commerce-api/inventory-items/${id}/uom-conversions/table`);
    return this.service.findUomConversionsForTable(id, userId);
  }

  // Creates a UOM conversion override for an inventory item
  @Post(':id/uom-conversions')
  @HttpCode(HttpStatus.CREATED)
  createUomConversion(
    @Param('id') id: string,
    @Body() dto: CreateInventoryItemUomConversionDto,
  ): Promise<CreateResponseDto<InventoryItemUomConversionResponseDto>> {
    this.logger.log(`POST /commerce-api/inventory-items/${id}/uom-conversions`);
    return this.service.createUomConversion(id, dto);
  }

  // Updates a UOM conversion override
  @Patch(':id/uom-conversions/:conversionId')
  updateUomConversion(
    @Param('id') id: string,
    @Param('conversionId') conversionId: string,
    @Body() dto: UpdateInventoryItemUomConversionDto,
  ): Promise<SuccessResponseDto> {
    this.logger.log(`PATCH /commerce-api/inventory-items/${id}/uom-conversions/${conversionId}`);
    return this.service.updateUomConversion(conversionId, dto);
  }

  // Deletes a UOM conversion override
  @Delete(':id/uom-conversions/:conversionId')
  deleteUomConversion(
    @Param('id') id: string,
    @Param('conversionId') conversionId: string,
  ): Promise<SuccessResponseDto> {
    this.logger.log(`DELETE /commerce-api/inventory-items/${id}/uom-conversions/${conversionId}`);
    return this.service.deleteUomConversion(conversionId);
  }

  // Updates an inventory item
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateInventoryItemDto): Promise<SuccessResponseDto> {
    this.logger.log(`PATCH /commerce-api/inventory-items/${id}`);
    return this.service.update(id, dto);
  }

  // Deletes an inventory item
  @Delete(':id')
  delete(@Param('id') id: string): Promise<SuccessResponseDto> {
    this.logger.log(`DELETE /commerce-api/inventory-items/${id}`);
    return this.service.delete(id);
  }
}
