import { CategoriesService } from '@domain/categories/services/categories.service';
import { Injectable, Logger } from '@nestjs/common';
import {
  type FieldMap,
  FilterProcessor,
  NotFoundException,
  type TableViewState,
} from '@vritti/api-sdk';
import { and, desc } from '@vritti/api-sdk/drizzle-orm';
import { type ItemOptionValue, items } from '@/db/schema';
import type { CreateItemDto } from '@/modules/items/dto/request/create-item.dto';
import type { SaveOptionsDto } from '@/modules/items/dto/request/save-options.dto';
import type { UpdateItemDto } from '@/modules/items/dto/request/update-item.dto';
import type { UpdateVariantDto } from '@/modules/items/dto/request/update-variant.dto';
import { ItemDto } from '../dto/entity/item.dto';
import { ItemDetailDto, ItemOptionDto, ItemVariantDto } from '../dto/entity/item-detail.dto';
import { ItemsRepository } from '../repositories/items.repository';

@Injectable()
export class ItemsService {
  private readonly logger = new Logger(ItemsService.name);

  private static readonly FIELD_MAP: FieldMap = {
    name: { column: items.name, type: 'string' },
    code: { column: items.code, type: 'string' },
    type: { column: items.type, type: 'string' },
    isAvailable: { column: items.isAvailable, type: 'boolean' },
    categoryId: { column: items.categoryId, type: 'string' },
  };

  constructor(
    private readonly itemsRepository: ItemsRepository,
    private readonly categoriesService: CategoriesService,
  ) {}

  // Returns paginated, filtered, and sorted items (RLS scopes to org + BU ancestors)
  async findForTable(state: TableViewState): Promise<{ result: ItemDto[]; count: number }> {
    const filterWhere = FilterProcessor.buildWhere(state.filters, ItemsService.FIELD_MAP);
    const searchWhere = FilterProcessor.buildSearch(state.search, ItemsService.FIELD_MAP);
    const where = and(filterWhere, searchWhere);
    const orderBy = FilterProcessor.buildOrderBy(state.sort, ItemsService.FIELD_MAP);
    const { limit = 20, offset = 0 } = state.pagination;

    const { result, count } = await this.itemsRepository.findForTable({
      where,
      orderBy: orderBy.length > 0 ? orderBy : [desc(items.createdAt)],
      limit,
      offset,
    });

    return { result: result.map((row) => ItemDto.from(row, row.categoryName)), count };
  }

  // Creates a new catalog item, auto-generating code if not provided
  async create(data: CreateItemDto): Promise<ItemDto> {
    if (data.categoryId) await this.categoriesService.assertIsLeaf(data.categoryId);
    const code = data.code || (await this.itemsRepository.generateCode());
    const entity = await this.itemsRepository.create({
      categoryId: data.categoryId ?? null,
      type: data.type,
      code,
      name: data.name,
      description: data.description ?? null,
      taxGroupId: data.taxGroupId ?? null,
      isAvailable: data.isAvailable ?? true,
      sortOrder: data.sortOrder ?? 0,
    });
    const categoryName = await this.itemsRepository.findCategoryName(entity.categoryId);
    this.logger.log(`Created item: ${entity.name} (${entity.id})`);
    return ItemDto.from(entity, categoryName);
  }

  // Returns an item by ID with full details including options and variants
  async findById(id: string): Promise<ItemDetailDto> {
    const entity = await this.itemsRepository.findById(id);
    if (!entity) throw new NotFoundException('Item not found.');

    const categoryName = await this.itemsRepository.findCategoryName(entity.categoryId);
    const optionEntities = await this.itemsRepository.findOptionsByItemId(id);

    // Build option DTOs with their values
    const optionDtos: ItemOptionDto[] = [];
    for (const opt of optionEntities) {
      const values = await this.itemsRepository.findOptionValuesByOptionId(opt.id);
      optionDtos.push(ItemOptionDto.from(opt, values));
    }

    // Build variant DTOs with their option value links
    const variantEntities = await this.itemsRepository.findVariantsByItemId(id);
    const variantIds = variantEntities.map((v) => v.id);
    const variantOptionValues = await this.itemsRepository.findVariantOptionValues(variantIds);
    const variantDtos = variantEntities.map((v) => {
      const ovIds = variantOptionValues.filter((vov) => vov.variantId === v.id).map((vov) => vov.optionValueId);
      return ItemVariantDto.from(v, ovIds);
    });

    return ItemDetailDto.from(entity, categoryName, optionDtos, variantDtos);
  }

  // Updates an item's basic info and returns the updated DTO
  async update(id: string, data: UpdateItemDto): Promise<ItemDto> {
    const existing = await this.itemsRepository.findById(id);
    if (!existing) throw new NotFoundException('Item not found.');

    if (data.categoryId) await this.categoriesService.assertIsLeaf(data.categoryId);

    const updatePayload: Record<string, unknown> = {};
    if (data.categoryId !== undefined) updatePayload.categoryId = data.categoryId;
    if (data.type !== undefined) updatePayload.type = data.type;
    if (data.name !== undefined) updatePayload.name = data.name;
    if (data.description !== undefined) updatePayload.description = data.description;
    if (data.taxGroupId !== undefined) updatePayload.taxGroupId = data.taxGroupId;
    if (data.isAvailable !== undefined) updatePayload.isAvailable = data.isAvailable;
    if (data.sortOrder !== undefined) updatePayload.sortOrder = data.sortOrder;

    const entity = await this.itemsRepository.update(id, updatePayload);
    const categoryName = await this.itemsRepository.findCategoryName(entity.categoryId);
    this.logger.log(`Updated item: ${entity.name} (${entity.id})`);
    return ItemDto.from(entity, categoryName);
  }

  // Deletes an item by ID (cascades to options, variants, images)
  async delete(id: string): Promise<{ success: boolean; message: string }> {
    const existing = await this.itemsRepository.findById(id);
    if (!existing) throw new NotFoundException('Item not found.');

    // Delete related data first
    await this.itemsRepository.deleteVariantsByItemId(id);
    await this.itemsRepository.deleteOptionsByItemId(id);
    await this.itemsRepository.delete(id);
    this.logger.log(`Deleted item: ${existing.name} (${id})`);
    return { success: true, message: `Item "${existing.name}" deleted successfully.` };
  }

  // Replaces all options and values for an item and returns updated detail
  async saveOptions(data: SaveOptionsDto): Promise<ItemDetailDto> {
    const existing = await this.itemsRepository.findById(data.itemId);
    if (!existing) throw new NotFoundException('Item not found.');

    // Delete existing variants (they depend on old option values)
    await this.itemsRepository.deleteVariantsByItemId(data.itemId);

    // Delete existing options and their values
    await this.itemsRepository.deleteOptionsByItemId(data.itemId);

    // Create new options and values
    for (let i = 0; i < data.options.length; i++) {
      const optInput = data.options[i];
      const option = await this.itemsRepository.createOption({
        itemId: data.itemId,
        name: optInput.name,
        sortOrder: i,
      });

      for (let j = 0; j < optInput.values.length; j++) {
        await this.itemsRepository.createOptionValue({
          optionId: option.id,
          value: optInput.values[j].value,
          sortOrder: j,
        });
      }
    }

    this.logger.log(`Saved ${data.options.length} options for item: ${data.itemId}`);
    return this.findById(data.itemId);
  }

  // Generates all variant combinations from current options
  async generateVariants(itemId: string): Promise<ItemVariantDto[]> {
    const existing = await this.itemsRepository.findById(itemId);
    if (!existing) throw new NotFoundException('Item not found.');

    // Delete existing variants first
    await this.itemsRepository.deleteVariantsByItemId(itemId);

    // Get options with their values
    const optionEntities = await this.itemsRepository.findOptionsByItemId(itemId);
    if (optionEntities.length === 0) return [];

    const optionsWithValues: { option: (typeof optionEntities)[0]; values: ItemOptionValue[] }[] = [];
    for (const opt of optionEntities) {
      const values = await this.itemsRepository.findOptionValuesByOptionId(opt.id);
      optionsWithValues.push({ option: opt, values });
    }

    // Compute cartesian product of all option values
    const combinations = this.cartesianProduct(optionsWithValues.map((o) => o.values));

    const result: ItemVariantDto[] = [];
    for (let i = 0; i < combinations.length; i++) {
      const combo = combinations[i];
      const variantName = combo.map((v) => v.value).join(' / ');
      const sku = `${existing.code}-${String(i + 1).padStart(3, '0')}`;

      const variant = await this.itemsRepository.createVariant({
        itemId,
        sku,
        name: variantName,
        price: 0,
        sortOrder: i,
      });

      await this.itemsRepository.createVariantOptionValues(
        combo.map((v) => ({ variantId: variant.id, optionValueId: v.id })),
      );

      result.push(
        ItemVariantDto.from(
          variant,
          combo.map((v) => v.id),
        ),
      );
    }

    this.logger.log(`Generated ${result.length} variants for item: ${itemId}`);
    return result;
  }

  // Returns all variants for an item with their option value links
  async listVariants(itemId: string): Promise<ItemVariantDto[]> {
    const existing = await this.itemsRepository.findById(itemId);
    if (!existing) throw new NotFoundException('Item not found.');

    const variantEntities = await this.itemsRepository.findVariantsByItemId(itemId);
    const variantIds = variantEntities.map((v) => v.id);
    const variantOptionValues = await this.itemsRepository.findVariantOptionValues(variantIds);

    return variantEntities.map((v) => {
      const ovIds = variantOptionValues.filter((vov) => vov.variantId === v.id).map((vov) => vov.optionValueId);
      return ItemVariantDto.from(v, ovIds);
    });
  }

  // Updates a single variant's fields
  async updateVariant(variantId: string, data: UpdateVariantDto): Promise<ItemVariantDto> {
    const existing = await this.itemsRepository.findVariantById(variantId);
    if (!existing) throw new NotFoundException('Variant not found.');

    const updatePayload: Record<string, unknown> = {};
    if (data.sku !== undefined) updatePayload.sku = data.sku;
    if (data.name !== undefined) updatePayload.name = data.name;
    if (data.price !== undefined) updatePayload.price = String(data.price);
    if (data.isAvailable !== undefined) updatePayload.isAvailable = data.isAvailable;
    if (data.manageInventory !== undefined) updatePayload.manageInventory = data.manageInventory;
    if (data.sortOrder !== undefined) updatePayload.sortOrder = data.sortOrder;

    const updated = await this.itemsRepository.updateVariant(variantId, updatePayload);

    const variantOptionValues = await this.itemsRepository.findVariantOptionValues([variantId]);
    const ovIds = variantOptionValues.map((vov) => vov.optionValueId);

    this.logger.log(`Updated variant: ${updated.sku} (${updated.id})`);
    return ItemVariantDto.from(updated, ovIds);
  }

  // Deletes a single variant and its option-value links
  async deleteVariant(variantId: string): Promise<{ success: boolean; message: string }> {
    const existing = await this.itemsRepository.findVariantById(variantId);
    if (!existing) throw new NotFoundException('Variant not found.');

    await this.itemsRepository.deleteVariant(variantId);
    this.logger.log(`Deleted variant: ${existing.name} (${variantId})`);
    return { success: true, message: `Variant "${existing.name}" deleted successfully.` };
  }

  // Computes the cartesian product of an array of arrays
  private cartesianProduct<T>(arrays: T[][]): T[][] {
    if (arrays.length === 0) return [[]];
    return arrays.reduce<T[][]>((acc, curr) => acc.flatMap((a) => curr.map((v) => [...a, v])), [[]]);
  }
}
