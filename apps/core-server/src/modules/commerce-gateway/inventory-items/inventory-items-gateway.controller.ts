import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Logger, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiQuery, ApiTags } from '@nestjs/swagger';
import {
  type CreateResponseDto,
  RequireSession,
  type SelectQueryResult,
  type SuccessResponseDto,
  UserId,
} from '@vritti/api-sdk';
import { SessionTypeValues } from '@/db/schema';
import { CreateInventoryItemDto } from './dto/request/create-inventory-item.dto';
import { CreateStorageLocationConfigDto } from './dto/request/create-storage-location-config.dto';
import { InventoryItemsSelectQueryDto } from './dto/request/inventory-items-select-query.dto';
import { UpdateInventoryItemDto } from './dto/request/update-inventory-item.dto';
import { UpdateStorageLocationConfigDto } from './dto/request/update-storage-location-config.dto';
import type { InventoryItemResponseDto } from './dto/response/inventory-item-response.dto';
import type { InventoryItemTableResponseDto } from './dto/response/inventory-item-table-response.dto';
import type { InventoryLedgerTableResponseDto } from './dto/response/inventory-ledger-table-response.dto';
import type { InventoryLevelTableResponseDto } from './dto/response/inventory-level-table-response.dto';
import { InventoryItemsGatewayService } from './services/inventory-items-gateway.service';

@ApiTags('Commerce - Inventory Items')
@ApiBearerAuth()
@RequireSession(SessionTypeValues.NEXUS)
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

  // Returns paginated inventory item options; filtered by PO when poId provided, by supplier when supplierId provided, else all
  @Get('select')
  @ApiQuery({ name: 'supplierId', required: false, type: String, description: 'Filter to items linked to a supplier' })
  @ApiQuery({
    name: 'poId',
    required: false,
    type: String,
    description: 'Filter to items on a purchase order (takes precedence over supplierId)',
  })
  select(@Query() query: InventoryItemsSelectQueryDto): Promise<SelectQueryResult> {
    this.logger.log('GET /commerce-api/inventory-items/select');
    return this.service.select(query, query.supplierId, query.poId);
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

  // Returns stock levels for an inventory item
  @Get(':id/levels')
  findLevels(@Param('id') id: string) {
    this.logger.log(`GET /commerce-api/inventory-items/${id}/levels`);
    return this.service.findLevels(id);
  }

  // Returns ledger entries for an inventory item
  @Get(':id/ledger')
  findLedger(@Param('id') id: string) {
    this.logger.log(`GET /commerce-api/inventory-items/${id}/ledger`);
    return this.service.findLedger(id);
  }

  // Returns paginated stock levels for an inventory item data table
  @Get(':id/levels/table')
  getLevelsTable(@Param('id') id: string, @UserId() userId: string): Promise<InventoryLevelTableResponseDto> {
    this.logger.log(`GET /commerce-api/inventory-items/${id}/levels/table`);
    return this.service.findLevelsForTable(id, userId);
  }

  // Returns paginated ledger entries for an inventory item data table
  @Get(':id/ledger/table')
  getLedgerTable(@Param('id') id: string, @UserId() userId: string): Promise<InventoryLedgerTableResponseDto> {
    this.logger.log(`GET /commerce-api/inventory-items/${id}/ledger/table`);
    return this.service.findLedgerForTable(id, userId);
  }

  // Returns location-wise stock aggregates for an inventory item
  @Get(':id/location-stock')
  getLocationStock(@Param('id') id: string) {
    this.logger.log(`GET /commerce-api/inventory-items/${id}/location-stock`);
    return this.service.findLocationStock(id);
  }

  // Returns paginated batches for an inventory item data table
  @Get(':id/batches/table')
  getBatchesTable(@Param('id') id: string, @UserId() userId: string) {
    this.logger.log(`GET /commerce-api/inventory-items/${id}/batches/table`);
    return this.service.findBatchesForTable(id, userId);
  }

  // Returns paginated storage location configs for an inventory item
  @Get(':id/storage-location-configs/table')
  getStorageLocationConfigsTable(@Param('id') id: string, @UserId() userId: string) {
    this.logger.log(`GET /commerce-api/inventory-items/${id}/storage-location-configs/table`);
    return this.service.findStorageLocationConfigsForTable(id, userId);
  }

  // Creates a storage location config for an inventory item
  @Post(':id/storage-location-configs')
  @HttpCode(HttpStatus.CREATED)
  async createStorageLocationConfig(@Param('id') id: string, @Body() dto: CreateStorageLocationConfigDto) {
    this.logger.log(`POST /commerce-api/inventory-items/${id}/storage-location-configs`);
    return this.service.createStorageLocationConfig(id, dto);
  }

  // Updates a storage location config
  @Patch(':id/storage-location-configs/:configId')
  updateStorageLocationConfig(
    @Param('id') id: string,
    @Param('configId') configId: string,
    @Body() dto: UpdateStorageLocationConfigDto,
  ) {
    this.logger.log(`PATCH /commerce-api/inventory-items/${id}/storage-location-configs/${configId}`);
    return this.service.updateStorageLocationConfig(configId, dto);
  }

  // Deletes a storage location config
  @Delete(':id/storage-location-configs/:configId')
  deleteStorageLocationConfig(@Param('id') id: string, @Param('configId') configId: string) {
    this.logger.log(`DELETE /commerce-api/inventory-items/${id}/storage-location-configs/${configId}`);
    return this.service.deleteStorageLocationConfig(configId);
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
