import { Inject, Injectable, Logger } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { DataTableStateService } from '@vritti/api-sdk';
import { UserService } from '@domain/user/services/user.service';
import { COMMERCE_SERVICE } from '../../commerce-client.module';
import type { CreateItemDto } from '../dto/create-item.dto';
import type { ItemDetailResponseDto } from '../dto/item-detail-response.dto';
import type { ItemModifierGroupResponseDto } from '../dto/item-modifier-group-response.dto';
import type { ItemResponseDto } from '../dto/item-response.dto';
import type { ItemsTableResponseDto } from '../dto/items-table-response.dto';
import type { SaveItemModifiersDto } from '../dto/save-item-modifiers.dto';
import type { SaveOptionsDto } from '../dto/save-options.dto';
import type { UpdateItemDto } from '../dto/update-item.dto';
import type { UpdateVariantDto } from '../dto/update-variant.dto';
import type { ItemVariantResponseDto } from '../dto/item-detail-response.dto';

@Injectable()
export class ItemsGatewayService {
  private readonly logger = new Logger(ItemsGatewayService.name);

  constructor(
    @Inject(COMMERCE_SERVICE) private readonly client: ClientProxy,
    private readonly userService: UserService,
    private readonly dataTableStateService: DataTableStateService,
  ) {}

  // Returns paginated, filtered, and sorted items for the data table
  async findForTable(userId: string, buId: string): Promise<ItemsTableResponseDto> {
    const { state, activeViewId } = await this.dataTableStateService.getCurrentState(userId, 'commerce-items');
    const { limit = 20, offset = 0 } = state.pagination ?? {};

    const { result, count } = (await this.client
      .send<{ result: ItemResponseDto[]; count: number }>(
        { cmd: 'items.table' },
        {
          businessUnitId: buId,
          filters: state.filters,
          sort: state.sort,
          search: state.search ?? null,
          pagination: { limit, offset },
        },
      )
      .toPromise()) as { result: ItemResponseDto[]; count: number };

    return { result, count, state, activeViewId };
  }

  // Creates a new item, resolving organizationId from the authenticated user
  async create(userId: string, dto: CreateItemDto): Promise<ItemResponseDto> {
    const user = await this.userService.findByIdOrThrow(userId);
    return this.client
      .send<ItemResponseDto>({ cmd: 'items.create' }, { organizationId: user.organizationId, ...dto })
      .toPromise() as Promise<ItemResponseDto>;
  }

  // Finds an item by ID with full details
  async findById(id: string): Promise<ItemDetailResponseDto> {
    return this.client
      .send<ItemDetailResponseDto>({ cmd: 'items.findById' }, { id })
      .toPromise() as Promise<ItemDetailResponseDto>;
  }

  // Updates an item by ID
  async update(userId: string, id: string, dto: UpdateItemDto): Promise<ItemResponseDto> {
    await this.userService.findByIdOrThrow(userId);
    return this.client
      .send<ItemResponseDto>({ cmd: 'items.update' }, { id, ...dto })
      .toPromise() as Promise<ItemResponseDto>;
  }

  // Deletes an item by ID
  async delete(id: string): Promise<{ success: boolean; message: string }> {
    return this.client
      .send<{ success: boolean; message: string }>({ cmd: 'items.delete' }, { id })
      .toPromise() as Promise<{ success: boolean; message: string }>;
  }

  // Bulk saves options for an item (replaces existing options)
  async saveOptions(userId: string, itemId: string, dto: SaveOptionsDto): Promise<ItemDetailResponseDto> {
    await this.userService.findByIdOrThrow(userId);
    return this.client
      .send<ItemDetailResponseDto>({ cmd: 'items.options.save' }, { itemId, ...dto })
      .toPromise() as Promise<ItemDetailResponseDto>;
  }

  // Generates variants based on current item options
  async generateVariants(userId: string, itemId: string): Promise<ItemVariantResponseDto[]> {
    await this.userService.findByIdOrThrow(userId);
    return this.client
      .send<ItemVariantResponseDto[]>({ cmd: 'items.variants.generate' }, { itemId })
      .toPromise() as Promise<ItemVariantResponseDto[]>;
  }

  // Lists all variants for an item
  async listVariants(itemId: string): Promise<ItemVariantResponseDto[]> {
    return this.client
      .send<ItemVariantResponseDto[]>({ cmd: 'items.variants.list' }, { itemId })
      .toPromise() as Promise<ItemVariantResponseDto[]>;
  }

  // Deletes a specific variant by ID
  async deleteVariant(variantId: string): Promise<{ success: boolean; message: string }> {
    return this.client
      .send<{ success: boolean; message: string }>({ cmd: 'items.variants.delete' }, { variantId })
      .toPromise() as Promise<{ success: boolean; message: string }>;
  }

  // Updates a specific variant
  async updateVariant(userId: string, itemId: string, variantId: string, dto: UpdateVariantDto): Promise<ItemVariantResponseDto> {
    await this.userService.findByIdOrThrow(userId);
    return this.client
      .send<ItemVariantResponseDto>({ cmd: 'items.variants.update' }, { itemId, variantId, ...dto })
      .toPromise() as Promise<ItemVariantResponseDto>;
  }

  // Lists modifier groups assigned to an item
  async listModifiers(itemId: string): Promise<ItemModifierGroupResponseDto[]> {
    return this.client
      .send<ItemModifierGroupResponseDto[]>({ cmd: 'items.modifiers.list' }, { itemId })
      .toPromise() as Promise<ItemModifierGroupResponseDto[]>;
  }

  // Saves modifier group assignments for an item (replaces existing)
  async saveModifiers(userId: string, itemId: string, dto: SaveItemModifiersDto): Promise<ItemModifierGroupResponseDto[]> {
    await this.userService.findByIdOrThrow(userId);
    return this.client
      .send<ItemModifierGroupResponseDto[]>({ cmd: 'items.modifiers.save' }, { itemId, ...dto })
      .toPromise() as Promise<ItemModifierGroupResponseDto[]>;
  }
}
