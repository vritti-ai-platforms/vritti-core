import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Logger, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { RequireSession, UserId } from '@vritti/api-sdk/auth';
import type { CreateResponseDto, SelectQueryResult, SuccessResponseDto } from '@vritti/api-sdk/database';
import { ORG_INVENTORY_ITEMS } from '@vritti/commerce-permissions/inventory-items';
import { SessionTypeValues } from '@/db/schema';
import { RequireFeature, RequirePermission } from '@/rbac/decorators';
import { AddInventoryItemMrpDto } from './dto/request/add-inventory-item-mrp.dto';
import { CreateInventoryItemDto } from './dto/request/create-inventory-item.dto';
import { CreateInventoryItemUomConversionDto } from './dto/request/create-inventory-item-uom-conversion.dto';
import { InventoryItemsSelectQueryDto } from './dto/request/inventory-items-select-query.dto';
import { UpdateInventoryItemDto } from './dto/request/update-inventory-item.dto';
import { UpdateInventoryItemMrpDto } from './dto/request/update-inventory-item-mrp.dto';
import { UpdateInventoryItemUomConversionDto } from './dto/request/update-inventory-item-uom-conversion.dto';
import type { InventoryItemMrpResponseDto } from './dto/response/inventory-item-mrp-response.dto';
import type { InventoryItemResponseDto } from './dto/response/inventory-item-response.dto';
import type { InventoryItemSupplierTableResponseDto } from './dto/response/inventory-item-supplier-response.dto';
import type { InventoryItemTableResponseDto } from './dto/response/inventory-item-table-response.dto';
import type { InventoryItemUomConversionResponseDto } from './dto/response/inventory-item-uom-conversion-response.dto';
import { InventoryItemsGatewayService } from './services/inventory-items-gateway.service';

@ApiTags('Commerce - Org Inventory Items')
@ApiBearerAuth()
@RequireSession(SessionTypeValues.WEB)
@RequireFeature(ORG_INVENTORY_ITEMS.featureCode)
@Controller('org/inventory-items')
export class InventoryItemsGatewayController {
  private readonly logger = new Logger(InventoryItemsGatewayController.name);

  constructor(private readonly service: InventoryItemsGatewayService) {}

  // Returns paginated org-wide inventory items for the data table
  @Get('table')
  @RequirePermission(ORG_INVENTORY_ITEMS.view)
  getTable(@UserId() userId: string): Promise<InventoryItemTableResponseDto> {
    this.logger.log('GET /commerce-api/org/inventory-items/table');
    return this.service.findForTable(userId);
  }

  // Returns paginated inventory item options for select dropdowns
  @Get('select')
  @RequirePermission(ORG_INVENTORY_ITEMS.view)
  select(@Query() query: InventoryItemsSelectQueryDto): Promise<SelectQueryResult> {
    this.logger.log('GET /commerce-api/org/inventory-items/select');
    return this.service.select(query);
  }

  // Creates a new org inventory item
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @RequirePermission(ORG_INVENTORY_ITEMS.add)
  async create(@Body() dto: CreateInventoryItemDto): Promise<CreateResponseDto<InventoryItemResponseDto>> {
    this.logger.log('POST /commerce-api/org/inventory-items');
    return this.service.create(dto);
  }

  // Returns paginated UOM conversion overrides for an inventory item
  @Get(':id/uom-conversions/table')
  @RequirePermission(ORG_INVENTORY_ITEMS.conversions.view)
  getUomConversionsTable(@Param('id') id: string, @UserId() userId: string) {
    this.logger.log(`GET /commerce-api/org/inventory-items/${id}/uom-conversions/table`);
    return this.service.findUomConversionsForTable(id, userId);
  }

  // Creates a UOM conversion override for an inventory item
  @Post(':id/uom-conversions')
  @HttpCode(HttpStatus.CREATED)
  @RequirePermission(ORG_INVENTORY_ITEMS.conversions.add)
  createUomConversion(
    @Param('id') id: string,
    @Body() dto: CreateInventoryItemUomConversionDto,
  ): Promise<CreateResponseDto<InventoryItemUomConversionResponseDto>> {
    this.logger.log(`POST /commerce-api/org/inventory-items/${id}/uom-conversions`);
    return this.service.createUomConversion(id, dto);
  }

  // Updates a UOM conversion override
  @Patch(':id/uom-conversions/:conversionId')
  @RequirePermission(ORG_INVENTORY_ITEMS.conversions.edit)
  updateUomConversion(
    @Param('id') id: string,
    @Param('conversionId') conversionId: string,
    @Body() dto: UpdateInventoryItemUomConversionDto,
  ): Promise<SuccessResponseDto> {
    this.logger.log(`PATCH /commerce-api/org/inventory-items/${id}/uom-conversions/${conversionId}`);
    return this.service.updateUomConversion(conversionId, dto);
  }

  // Deletes a UOM conversion override
  @Delete(':id/uom-conversions/:conversionId')
  @RequirePermission(ORG_INVENTORY_ITEMS.conversions.delete)
  deleteUomConversion(
    @Param('id') id: string,
    @Param('conversionId') conversionId: string,
  ): Promise<SuccessResponseDto> {
    this.logger.log(`DELETE /commerce-api/org/inventory-items/${id}/uom-conversions/${conversionId}`);
    return this.service.deleteUomConversion(conversionId);
  }

  // Returns the suggested MRPs (one per currency) for an inventory item
  @Get(':id/mrp')
  @RequirePermission(ORG_INVENTORY_ITEMS.mrp.view)
  getMrp(@Param('id') id: string): Promise<InventoryItemMrpResponseDto[]> {
    this.logger.log(`GET /commerce-api/org/inventory-items/${id}/mrp`);
    return this.service.findMrp(id);
  }

  // Adds a manual MRP for an inventory item
  @Post(':id/mrp')
  @RequirePermission(ORG_INVENTORY_ITEMS.mrp.add)
  addMrp(@Param('id') id: string, @Body() dto: AddInventoryItemMrpDto): Promise<InventoryItemMrpResponseDto> {
    this.logger.log(`POST /commerce-api/org/inventory-items/${id}/mrp`);
    return this.service.addMrp(id, dto);
  }

  // Updates a manual MRP for an inventory item
  @Patch(':id/mrp/:mrpId')
  @RequirePermission(ORG_INVENTORY_ITEMS.mrp.edit)
  updateMrp(
    @Param('id') id: string,
    @Param('mrpId') mrpId: string,
    @Body() dto: UpdateInventoryItemMrpDto,
  ): Promise<InventoryItemMrpResponseDto> {
    this.logger.log(`PATCH /commerce-api/org/inventory-items/${id}/mrp/${mrpId}`);
    return this.service.updateMrp(id, mrpId, dto);
  }

  // Deletes a manual MRP for an inventory item
  @Delete(':id/mrp/:mrpId')
  @RequirePermission(ORG_INVENTORY_ITEMS.mrp.delete)
  deleteMrp(@Param('id') id: string, @Param('mrpId') mrpId: string): Promise<SuccessResponseDto> {
    this.logger.log(`DELETE /commerce-api/org/inventory-items/${id}/mrp/${mrpId}`);
    return this.service.deleteMrp(mrpId);
  }

  // Returns suppliers carrying this item, table-shaped
  @Get(':id/suppliers/table')
  @RequirePermission(ORG_INVENTORY_ITEMS.view)
  getSuppliersTable(@Param('id') id: string, @UserId() userId: string): Promise<InventoryItemSupplierTableResponseDto> {
    this.logger.log(`GET /commerce-api/org/inventory-items/${id}/suppliers/table`);
    return this.service.findSuppliersTable(id, userId);
  }

  // Returns a single inventory item
  @Get(':id')
  @RequirePermission(ORG_INVENTORY_ITEMS.view)
  findById(@Param('id') id: string): Promise<InventoryItemResponseDto> {
    this.logger.log(`GET /commerce-api/org/inventory-items/${id}`);
    return this.service.findById(id);
  }

  // Updates an inventory item
  @Patch(':id')
  @RequirePermission(ORG_INVENTORY_ITEMS.edit)
  update(@Param('id') id: string, @Body() dto: UpdateInventoryItemDto): Promise<SuccessResponseDto> {
    this.logger.log(`PATCH /commerce-api/org/inventory-items/${id}`);
    return this.service.update(id, dto);
  }

  // Deletes an inventory item
  @Delete(':id')
  @RequirePermission(ORG_INVENTORY_ITEMS.delete)
  delete(@Param('id') id: string): Promise<SuccessResponseDto> {
    this.logger.log(`DELETE /commerce-api/org/inventory-items/${id}`);
    return this.service.delete(id);
  }
}
