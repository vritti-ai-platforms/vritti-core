import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Logger, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { type CreateResponseDto, RequireSession, SelectOptionsQueryDto, type SelectQueryResult, type SuccessResponseDto, UserId } from '@vritti/api-sdk';
import { SessionTypeValues } from '@/db/schema';
import { CreateInventoryItemDto } from './dto/request/create-inventory-item.dto';
import { UpdateInventoryItemDto } from './dto/request/update-inventory-item.dto';
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

  // Returns paginated inventory item options for select dropdowns
  @Get('select')
  select(@Query() query: SelectOptionsQueryDto): Promise<SelectQueryResult> {
    this.logger.log('GET /commerce-api/inventory-items/select');
    return this.service.select(query);
  }

  // Creates a new inventory item
  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() dto: CreateInventoryItemDto): Promise<CreateResponseDto<InventoryItemResponseDto>> {
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
