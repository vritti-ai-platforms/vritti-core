import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Logger, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { RequireSession, SelectOptionsQueryDto, type SelectQueryResult, UserId } from '@vritti/api-sdk';
import { SessionTypeValues } from '@/db/schema';
import { CreateInventoryItemDto } from './dto/request/create-inventory-item.dto';
import { UpdateInventoryItemDto } from './dto/request/update-inventory-item.dto';
import type { InventoryItemResponseDto } from './dto/response/inventory-item-response.dto';
import type { InventoryItemTableResponseDto } from './dto/response/inventory-item-table-response.dto';
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
    return this.service.findForTable(userId);
  }

  // Returns paginated inventory item options for select dropdowns
  @Get('select')
  select(@Query() query: SelectOptionsQueryDto): Promise<SelectQueryResult> {
    return this.service.select(query);
  }

  // Creates a new inventory item
  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() dto: CreateInventoryItemDto): Promise<InventoryItemResponseDto> {
    return this.service.create(dto);
  }

  // Returns inventory item detail with levels and ledger
  @Get(':id')
  findById(@Param('id') id: string) {
    return this.service.findById(id);
  }

  // Updates an inventory item
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateInventoryItemDto): Promise<InventoryItemResponseDto> {
    return this.service.update(id, dto);
  }

  // Deletes an inventory item
  @Delete(':id')
  delete(@Param('id') id: string): Promise<{ success: boolean; message: string }> {
    return this.service.delete(id);
  }
}
