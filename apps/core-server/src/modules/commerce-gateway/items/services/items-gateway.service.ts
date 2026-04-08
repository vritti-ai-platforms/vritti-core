import { Injectable, Logger } from '@nestjs/common';
import { DataTableStateService, NatsClientService } from '@vritti/api-sdk';
import type { CreateItemDto } from '../dto/request/create-item.dto';
import type { SaveItemModifiersDto } from '../dto/request/save-item-modifiers.dto';
import type { SaveOptionsDto } from '../dto/request/save-options.dto';
import type { UpdateItemDto } from '../dto/request/update-item.dto';
import type { UpdateVariantDto } from '../dto/request/update-variant.dto';
import type { ItemDetailResponseDto, ItemVariantResponseDto } from '../dto/response/item-detail-response.dto';
import type { ItemModifierGroupResponseDto } from '../dto/response/item-modifier-group-response.dto';
import type { ItemResponseDto } from '../dto/response/item-response.dto';
import type { ItemsTableResponseDto } from '../dto/response/items-table-response.dto';

@Injectable()
export class ItemsGatewayService {
  private readonly logger = new Logger(ItemsGatewayService.name);

  constructor(
    private readonly nats: NatsClientService,
    private readonly dataTableStateService: DataTableStateService,
  ) {}

  // Returns paginated, filtered, and sorted items for the data table
  async findForTable(userId: string): Promise<ItemsTableResponseDto> {
    this.logger.log('items.table');
    const { state, activeViewId } = await this.dataTableStateService.getCurrentState(userId, 'commerce-items');
    const { limit = 20, offset = 0 } = state.pagination ?? {};

    const { result, count } = await this.nats.send<{ result: ItemResponseDto[]; count: number }>(
      'commerce',
      'items.table',
      {
        filters: state.filters,
        sort: state.sort,
        search: state.search ?? null,
        pagination: { limit, offset },
      },
    );

    return { result, count, state, activeViewId };
  }

  // Creates a new item
  async create(dto: CreateItemDto): Promise<ItemResponseDto> {
    this.logger.log(`items.create — name: ${dto.name}`);
    return this.nats.send('commerce', 'items.create', dto);
  }

  // Finds an item by ID with full details
  async findById(id: string): Promise<ItemDetailResponseDto> {
    this.logger.log(`items.findById — id: ${id}`);
    return this.nats.send('commerce', 'items.findById', { id });
  }

  // Updates an item by ID
  async update(id: string, dto: UpdateItemDto): Promise<ItemResponseDto> {
    this.logger.log(`items.update — id: ${id}`);
    return this.nats.send('commerce', 'items.update', { id, ...dto });
  }

  // Deletes an item by ID
  async delete(id: string): Promise<{ success: boolean; message: string }> {
    this.logger.log(`items.delete — id: ${id}`);
    return this.nats.send('commerce', 'items.delete', { id });
  }

  // Bulk saves options for an item (replaces existing options)
  async saveOptions(itemId: string, dto: SaveOptionsDto): Promise<ItemDetailResponseDto> {
    this.logger.log(`items.options.save — itemId: ${itemId}`);
    return this.nats.send('commerce', 'items.options.save', { itemId, ...dto });
  }

  // Generates variants based on current item options
  async generateVariants(itemId: string): Promise<ItemVariantResponseDto[]> {
    this.logger.log(`items.variants.generate — itemId: ${itemId}`);
    return this.nats.send('commerce', 'items.variants.generate', { itemId });
  }

  // Lists all variants for an item
  async listVariants(itemId: string): Promise<ItemVariantResponseDto[]> {
    this.logger.log(`items.variants.list — itemId: ${itemId}`);
    return this.nats.send('commerce', 'items.variants.list', { itemId });
  }

  // Deletes a specific variant by ID
  async deleteVariant(variantId: string): Promise<{ success: boolean; message: string }> {
    this.logger.log(`items.variants.delete — variantId: ${variantId}`);
    return this.nats.send('commerce', 'items.variants.delete', { variantId });
  }

  // Updates a specific variant
  async updateVariant(itemId: string, variantId: string, dto: UpdateVariantDto): Promise<ItemVariantResponseDto> {
    this.logger.log(`items.variants.update — variantId: ${variantId}`);
    return this.nats.send('commerce', 'items.variants.update', { itemId, variantId, ...dto });
  }

  // Lists modifier groups assigned to an item
  async listModifiers(itemId: string): Promise<ItemModifierGroupResponseDto[]> {
    this.logger.log(`items.modifiers.list — itemId: ${itemId}`);
    return this.nats.send('commerce', 'items.modifiers.list', { itemId });
  }

  // Saves modifier group assignments for an item (replaces existing)
  async saveModifiers(itemId: string, dto: SaveItemModifiersDto): Promise<ItemModifierGroupResponseDto[]> {
    this.logger.log(`items.modifiers.save — itemId: ${itemId}`);
    return this.nats.send('commerce', 'items.modifiers.save', { itemId, ...dto });
  }
}
