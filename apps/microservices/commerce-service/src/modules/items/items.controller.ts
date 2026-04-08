import { Controller, Logger } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import type { FilterCondition, SearchState, SortCondition } from '@vritti/api-sdk';
import type { ItemDto } from '@domain/items/dto/entity/item.dto';
import type { ItemDetailDto, ItemVariantDto } from '@domain/items/dto/entity/item-detail.dto';
import type { CreateItemDto } from './dto/request/create-item.dto';
import type { UpdateItemDto } from './dto/request/update-item.dto';
import type { SaveOptionsDto } from './dto/request/save-options.dto';
import type { UpdateVariantDto } from './dto/request/update-variant.dto';
import { ItemsService } from '@domain/items/services/items.service';

@Controller()
export class ItemsController {
  private readonly logger = new Logger(ItemsController.name);

  constructor(private readonly itemsService: ItemsService) {}

  // Returns paginated, filtered, and sorted items (RLS scopes to org + BU ancestors)
  @MessagePattern({ cmd: 'items.table' })
  async table(@Payload() data: {
    filters: FilterCondition[];
    sort: SortCondition[];
    search: SearchState | null;
    pagination: { limit: number; offset: number };
  }): Promise<{ result: ItemDto[]; count: number }> {
    this.logger.log('items.table');
    return this.itemsService.findForTable({
      filters: data.filters ?? [],
      sort: data.sort ?? [],
      search: data.search ?? null,
      pagination: data.pagination ?? { limit: 20, offset: 0 },
    });
  }

  // Creates a new catalog item (org_id/bu_id auto-filled by DB defaults from session vars)
  @MessagePattern({ cmd: 'items.create' })
  async create(@Payload() dto: CreateItemDto): Promise<ItemDto> {
    this.logger.log(`items.create — name: ${dto.name}`);
    return this.itemsService.create(dto);
  }

  // Finds an item by ID with full details (RLS scopes visibility)
  @MessagePattern({ cmd: 'items.findById' })
  async findById(@Payload() data: { id: string }): Promise<ItemDetailDto> {
    this.logger.log(`items.findById — id: ${data.id}`);
    return this.itemsService.findById(data.id);
  }

  // Updates an item's basic info
  @MessagePattern({ cmd: 'items.update' })
  async update(@Payload() data: { id: string } & UpdateItemDto): Promise<ItemDto> {
    const { id, ...updateData } = data;
    this.logger.log(`items.update — id: ${id}`);
    return this.itemsService.update(id, updateData);
  }

  // Deletes an item by ID
  @MessagePattern({ cmd: 'items.delete' })
  async delete(@Payload() data: { id: string }): Promise<{ success: boolean; message: string }> {
    this.logger.log(`items.delete — id: ${data.id}`);
    return this.itemsService.delete(data.id);
  }

  // Replaces all options and values for an item
  @MessagePattern({ cmd: 'items.options.save' })
  async saveOptions(@Payload() data: SaveOptionsDto): Promise<ItemDetailDto> {
    this.logger.log(`items.options.save — itemId: ${data.itemId}`);
    return this.itemsService.saveOptions(data);
  }

  // Generates variants from current options
  @MessagePattern({ cmd: 'items.variants.generate' })
  async generateVariants(@Payload() data: { itemId: string }): Promise<ItemVariantDto[]> {
    this.logger.log(`items.variants.generate — itemId: ${data.itemId}`);
    return this.itemsService.generateVariants(data.itemId);
  }

  // Lists variants for an item
  @MessagePattern({ cmd: 'items.variants.list' })
  async listVariants(@Payload() data: { itemId: string }): Promise<ItemVariantDto[]> {
    this.logger.log(`items.variants.list — itemId: ${data.itemId}`);
    return this.itemsService.listVariants(data.itemId);
  }

  // Deletes a single variant by ID
  @MessagePattern({ cmd: 'items.variants.delete' })
  async deleteVariant(@Payload() data: { variantId: string }): Promise<{ success: boolean; message: string }> {
    this.logger.log(`items.variants.delete — variantId: ${data.variantId}`);
    return this.itemsService.deleteVariant(data.variantId);
  }

  // Updates a single variant
  @MessagePattern({ cmd: 'items.variants.update' })
  async updateVariant(@Payload() data: { itemId: string; variantId: string } & UpdateVariantDto): Promise<ItemVariantDto> {
    const { itemId: _itemId, variantId, ...updateData } = data;
    this.logger.log(`items.variants.update — variantId: ${variantId}`);
    return this.itemsService.updateVariant(variantId, updateData);
  }
}
