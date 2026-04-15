import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Logger, Param, Patch, Post, Put } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { RequireSession, type SuccessResponseDto, UserId } from '@vritti/api-sdk';
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
import { CreateItemDto } from './dto/request/create-item.dto';
import { SaveItemModifiersDto } from './dto/request/save-item-modifiers.dto';
import { SaveOptionsDto } from './dto/request/save-options.dto';
import { UpdateItemDto } from './dto/request/update-item.dto';
import { UpdateVariantDto } from './dto/request/update-variant.dto';
import type { ItemDetailResponseDto, ItemVariantResponseDto } from './dto/response/item-detail-response.dto';
import type { ItemModifierGroupResponseDto } from './dto/response/item-modifier-group-response.dto';
import type { ItemResponseDto } from './dto/response/item-response.dto';
import type { ItemsTableResponseDto } from './dto/response/items-table-response.dto';
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
  getItemsTable(@UserId() userId: string): Promise<ItemsTableResponseDto> {
    return this.itemsGatewayService.findForTable(userId);
  }

  // Creates a new catalog item
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiCreateItem()
  async create(@Body() dto: CreateItemDto): Promise<ItemResponseDto> {
    return this.itemsGatewayService.create(dto);
  }

  // Returns an item with full details
  @Get(':id')
  @ApiGetItem()
  async findById(@Param('id') id: string): Promise<ItemDetailResponseDto> {
    return this.itemsGatewayService.findById(id);
  }

  // Updates an item by ID
  @Patch(':id')
  @ApiUpdateItem()
  async update(@Param('id') id: string, @Body() dto: UpdateItemDto): Promise<ItemResponseDto> {
    return this.itemsGatewayService.update(id, dto);
  }

  // Deletes an item by ID
  @Delete(':id')
  @ApiDeleteItem()
  async delete(@Param('id') id: string): Promise<SuccessResponseDto> {
    return this.itemsGatewayService.delete(id);
  }

  // Bulk saves options for an item
  @Put(':id/options')
  @ApiSaveItemOptions()
  async saveOptions(@Param('id') id: string, @Body() dto: SaveOptionsDto): Promise<ItemDetailResponseDto> {
    return this.itemsGatewayService.saveOptions(id, dto);
  }

  // Generates variants based on item options
  @Post(':id/variants/generate')
  @HttpCode(HttpStatus.CREATED)
  @ApiGenerateItemVariants()
  async generateVariants(@Param('id') id: string): Promise<ItemVariantResponseDto[]> {
    return this.itemsGatewayService.generateVariants(id);
  }

  // Lists all variants for an item
  @Get(':id/variants')
  @ApiListItemVariants()
  async listVariants(@Param('id') id: string): Promise<ItemVariantResponseDto[]> {
    return this.itemsGatewayService.listVariants(id);
  }

  // Deletes a specific variant by ID
  @Delete(':id/variants/:variantId')
  @ApiDeleteItemVariant()
  async deleteVariant(@Param('variantId') variantId: string): Promise<SuccessResponseDto> {
    return this.itemsGatewayService.deleteVariant(variantId);
  }

  // Updates a specific variant
  @Patch(':id/variants/:variantId')
  @ApiUpdateItemVariant()
  async updateVariant(
    @Param('id') id: string,
    @Param('variantId') variantId: string,
    @Body() dto: UpdateVariantDto,
  ): Promise<ItemVariantResponseDto> {
    return this.itemsGatewayService.updateVariant(id, variantId, dto);
  }

  // Lists modifier groups assigned to an item
  @Get(':id/modifiers')
  @ApiListItemModifiers()
  async listModifiers(@Param('id') id: string): Promise<ItemModifierGroupResponseDto[]> {
    return this.itemsGatewayService.listModifiers(id);
  }

  // Saves modifier group assignments for an item
  @Put(':id/modifiers')
  @ApiSaveItemModifiers()
  async saveModifiers(@Param('id') id: string, @Body() dto: SaveItemModifiersDto): Promise<ItemModifierGroupResponseDto[]> {
    return this.itemsGatewayService.saveModifiers(id, dto);
  }
}
