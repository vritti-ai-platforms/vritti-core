import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Logger, Param, Patch, Post, Put, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { RequireSession, UserId } from '@vritti/api-sdk';
import { SessionTypeValues } from '@/db/schema';
import {
  ApiCreateItem,
  ApiDeleteItem,
  ApiDeleteItemVariant,
  ApiGenerateItemVariants,
  ApiGetItem,
  ApiGetItemsTable,
  ApiListItemModifiers,
  ApiListItemVariants,
  ApiSaveItemModifiers,
  ApiSaveItemOptions,
  ApiUpdateItem,
  ApiUpdateItemVariant,
} from './docs/items-gateway.docs';
import { CreateItemDto } from './dto/create-item.dto';
import type { ItemDetailResponseDto, ItemVariantResponseDto } from './dto/item-detail-response.dto';
import type { ItemModifierGroupResponseDto } from './dto/item-modifier-group-response.dto';
import type { ItemResponseDto } from './dto/item-response.dto';
import type { ItemsTableResponseDto } from './dto/items-table-response.dto';
import { SaveItemModifiersDto } from './dto/save-item-modifiers.dto';
import { SaveOptionsDto } from './dto/save-options.dto';
import { UpdateItemDto } from './dto/update-item.dto';
import { UpdateVariantDto } from './dto/update-variant.dto';
import { ItemsGatewayService } from './services/items-gateway.service';

@ApiTags('Commerce - Items')
@ApiBearerAuth()
@RequireSession(SessionTypeValues.NEXUS)
@Controller('items')
export class ItemsGatewayController {
  private readonly logger = new Logger(ItemsGatewayController.name);

  constructor(private readonly itemsGatewayService: ItemsGatewayService) {}

  // Returns paginated items for the data table with server-stored state
  @Get('table')
  @ApiGetItemsTable()
  getItemsTable(@UserId() userId: string, @Query('buId') buId: string): Promise<ItemsTableResponseDto> {
    this.logger.log(`GET /commerce-api/items/table?buId=${buId} — user: ${userId}`);
    return this.itemsGatewayService.findForTable(userId, buId);
  }

  // Creates a new catalog item
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiCreateItem()
  async create(@UserId() userId: string, @Body() dto: CreateItemDto): Promise<ItemResponseDto> {
    this.logger.log(`POST /commerce-api/items — user: ${userId}`);
    return this.itemsGatewayService.create(userId, dto);
  }

  // Returns an item with full details
  @Get(':id')
  @ApiGetItem()
  async findById(@UserId() userId: string, @Param('id') id: string): Promise<ItemDetailResponseDto> {
    this.logger.log(`GET /commerce-api/items/${id} — user: ${userId}`);
    return this.itemsGatewayService.findById(id);
  }

  // Updates an item by ID
  @Patch(':id')
  @ApiUpdateItem()
  async update(
    @UserId() userId: string,
    @Param('id') id: string,
    @Body() dto: UpdateItemDto,
  ): Promise<ItemResponseDto> {
    this.logger.log(`PATCH /commerce-api/items/${id} — user: ${userId}`);
    return this.itemsGatewayService.update(userId, id, dto);
  }

  // Deletes an item by ID
  @Delete(':id')
  @ApiDeleteItem()
  async delete(@UserId() userId: string, @Param('id') id: string): Promise<{ success: boolean; message: string }> {
    this.logger.log(`DELETE /commerce-api/items/${id} — user: ${userId}`);
    return this.itemsGatewayService.delete(id);
  }

  // Bulk saves options for an item
  @Put(':id/options')
  @ApiSaveItemOptions()
  async saveOptions(
    @UserId() userId: string,
    @Param('id') id: string,
    @Body() dto: SaveOptionsDto,
  ): Promise<ItemDetailResponseDto> {
    this.logger.log(`PUT /commerce-api/items/${id}/options — user: ${userId}`);
    return this.itemsGatewayService.saveOptions(userId, id, dto);
  }

  // Generates variants based on item options
  @Post(':id/variants/generate')
  @HttpCode(HttpStatus.CREATED)
  @ApiGenerateItemVariants()
  async generateVariants(@UserId() userId: string, @Param('id') id: string): Promise<ItemVariantResponseDto[]> {
    this.logger.log(`POST /commerce-api/items/${id}/variants/generate — user: ${userId}`);
    return this.itemsGatewayService.generateVariants(userId, id);
  }

  // Lists all variants for an item
  @Get(':id/variants')
  @ApiListItemVariants()
  async listVariants(@UserId() userId: string, @Param('id') id: string): Promise<ItemVariantResponseDto[]> {
    this.logger.log(`GET /commerce-api/items/${id}/variants — user: ${userId}`);
    return this.itemsGatewayService.listVariants(id);
  }

  // Deletes a specific variant by ID
  @Delete(':id/variants/:variantId')
  @ApiDeleteItemVariant()
  async deleteVariant(
    @UserId() userId: string,
    @Param('id') id: string,
    @Param('variantId') variantId: string,
  ): Promise<{ success: boolean; message: string }> {
    this.logger.log(`DELETE /commerce-api/items/${id}/variants/${variantId} — user: ${userId}`);
    return this.itemsGatewayService.deleteVariant(variantId);
  }

  // Updates a specific variant
  @Patch(':id/variants/:variantId')
  @ApiUpdateItemVariant()
  async updateVariant(
    @UserId() userId: string,
    @Param('id') id: string,
    @Param('variantId') variantId: string,
    @Body() dto: UpdateVariantDto,
  ): Promise<ItemVariantResponseDto> {
    this.logger.log(`PATCH /commerce-api/items/${id}/variants/${variantId} — user: ${userId}`);
    return this.itemsGatewayService.updateVariant(userId, id, variantId, dto);
  }

  // Lists modifier groups assigned to an item
  @Get(':id/modifiers')
  @ApiListItemModifiers()
  async listModifiers(@UserId() userId: string, @Param('id') id: string): Promise<ItemModifierGroupResponseDto[]> {
    this.logger.log(`GET /commerce-api/items/${id}/modifiers — user: ${userId}`);
    return this.itemsGatewayService.listModifiers(id);
  }

  // Saves modifier group assignments for an item
  @Put(':id/modifiers')
  @ApiSaveItemModifiers()
  async saveModifiers(
    @UserId() userId: string,
    @Param('id') id: string,
    @Body() dto: SaveItemModifiersDto,
  ): Promise<ItemModifierGroupResponseDto[]> {
    this.logger.log(`PUT /commerce-api/items/${id}/modifiers — user: ${userId}`);
    return this.itemsGatewayService.saveModifiers(userId, id, dto);
  }
}
