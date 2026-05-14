import { Injectable, Logger } from '@nestjs/common';
import {
  ConflictException,
  type CreateResponseDto,
  type FieldMap,
  FilterProcessor,
  NotFoundException,
  type SelectOptionsQueryDto,
  type SelectQueryResult,
  type SuccessResponseDto,
  type TableViewState,
} from '@vritti/api-sdk';
import { and, desc } from '@vritti/api-sdk/drizzle-orm';
import { inventoryItems } from '@/db/schema';
import type { CreateInventoryItemDto } from '@/modules/inventory-items/root/dto/request/create-inventory-item.dto';
import type { UpdateInventoryItemDto } from '@/modules/inventory-items/root/dto/request/update-inventory-item.dto';
import { InventoryItemDto } from '../dto/entity/inventory-item.dto';
import { InventoryItemsRepository } from '../repositories/inventory-items.repository';

@Injectable()
export class InventoryItemsService {
  private readonly logger = new Logger(InventoryItemsService.name);

  private static readonly SEARCH_FIELD_MAP: FieldMap = {
    name: { column: inventoryItems.name, type: 'string' },
    code: { column: inventoryItems.code, type: 'string' },
  };
  private static readonly FILTER_FIELD_MAP: FieldMap = {
    type: { column: inventoryItems.type, type: 'string' },
    tracking: { column: inventoryItems.tracking, type: 'string' },
    categoryId: { column: inventoryItems.categoryId, type: 'string' },
    uomId: { column: inventoryItems.uomId, type: 'string' },
  };

  constructor(private readonly repository: InventoryItemsRepository) {}

  // Returns paginated, filtered, and sorted inventory items for the data table
  async findForTable(state: TableViewState): Promise<{ result: InventoryItemDto[]; count: number }> {
    const filterWhere = FilterProcessor.buildWhere(state.filters, InventoryItemsService.FILTER_FIELD_MAP);
    const searchWhere = FilterProcessor.buildSearch(state.search, InventoryItemsService.SEARCH_FIELD_MAP);
    const where = and(filterWhere, searchWhere);
    const orderBy = FilterProcessor.buildOrderBy(state.sort, {
      ...InventoryItemsService.SEARCH_FIELD_MAP,
      ...InventoryItemsService.FILTER_FIELD_MAP,
    });
    const { limit = 20, offset = 0 } = state.pagination;

    const { result: rows, count } = await this.repository.findAllWithUom({
      where: where || undefined,
      orderBy: orderBy.length > 0 ? orderBy : [desc(inventoryItems.createdAt)],
      limit,
      offset,
    });

    const dtos = rows.map((row) => InventoryItemDto.from(row, row.uomSymbol, true, row.categoryName));

    return { result: dtos, count };
  }

  // Returns paginated inventory item options for select dropdowns
  findForSelect(query: SelectOptionsQueryDto): Promise<SelectQueryResult> {
    return this.repository.findForSelectWithUom({
      value: query.valueKey || 'id',
      label: query.labelKey || 'name',
      description: query.descriptionKey,
      additionalKeys: query.additionalKeys,
      groupIdKey: query.groupIdKey,
      search: query.search,
      limit: query.limit,
      offset: query.offset,
      values: query.values,
      excludeIds: query.excludeIds,
      orderByKey: query.orderByKey || 'name',
      orderDirection: query.orderDirection || 'asc',
    });
  }

  // Returns inventory items linked to a specific supplier for select dropdowns
  findForSelectBySupplier(supplierId: string, query: SelectOptionsQueryDto): Promise<SelectQueryResult> {
    return this.repository.findForSelectBySupplier(supplierId, {
      value: query.valueKey || 'id',
      label: query.labelKey || 'name',
      description: query.descriptionKey,
      additionalKeys: query.additionalKeys,
      groupIdKey: query.groupIdKey || 'categoryId',
      search: query.search,
      limit: query.limit,
      offset: query.offset,
      values: query.values,
      excludeIds: query.excludeIds,
      orderByKey: query.orderByKey || 'name',
      orderDirection: query.orderDirection || 'asc',
    });
  }

  // Returns inventory items scoped to a purchase order for select dropdowns
  findForSelectByPurchaseOrder(poId: string, query: SelectOptionsQueryDto): Promise<SelectQueryResult> {
    return this.repository.findForSelectByPurchaseOrder(poId, {
      value: query.valueKey || 'id',
      label: query.labelKey || 'name',
      description: query.descriptionKey,
      additionalKeys: query.additionalKeys,
      groupIdKey: query.groupIdKey,
      search: query.search,
      limit: query.limit,
      offset: query.offset,
      values: query.values,
      excludeIds: query.excludeIds,
      orderByKey: query.orderByKey || 'name',
      orderDirection: query.orderDirection || 'asc',
    });
  }

  // Creates a new inventory item
  async create(data: CreateInventoryItemDto): Promise<CreateResponseDto<InventoryItemDto>> {
    const entity = await this.repository.create({
      name: data.name,
      code: data.code,
      type: data.type,
      ...(data.tracking ? { tracking: data.tracking } : {}),
      ...(data.pickStrategy ? { pickStrategy: data.pickStrategy } : {}),
      categoryId: data.categoryId,
      description: data.description || null,
      uomId: data.uomId,
    });
    const [uomSymbol, categoryName] = await Promise.all([
      this.repository.findUomSymbol(entity.uomId),
      this.repository.findCategoryName(entity.categoryId),
    ]);
    this.logger.log(`Created inventory item: ${entity.name} (${entity.code})`);
    return {
      success: true,
      message: `Inventory item "${entity.name}" (${entity.code}) created successfully.`,
      data: InventoryItemDto.from(entity, uomSymbol, true, categoryName),
    };
  }

  // Returns a single inventory item with UOM symbol and canDelete
  async findById(id: string): Promise<InventoryItemDto> {
    const entity = await this.repository.findByIdWithUomAndCategory(id);
    if (!entity) throw new NotFoundException('Inventory item not found.');
    const referencedIds = await this.repository.findReferencedIds([id]);
    return InventoryItemDto.from(entity, entity.uomSymbol, !referencedIds.has(id), entity.categoryName);
  }

  // Returns the UOM IDs the given item can transact in: primary + per-item conversions + globally derivable family
  async findAllowedUomIds(itemId: string): Promise<string[]> {
    const entity = await this.repository.findById(itemId);
    if (!entity) throw new NotFoundException('Inventory item not found.');
    return this.repository.findAllowedUomIds(itemId);
  }

  // Updates an inventory item. Tracking is set at creation and cannot be changed.
  async update(id: string, data: UpdateInventoryItemDto): Promise<SuccessResponseDto> {
    const existing = await this.repository.findById(id);
    if (!existing) throw new NotFoundException('Inventory item not found.');
    if (data.description !== undefined) data.description = data.description || null;
    const updated = await this.repository.update(id, data);
    this.logger.log(`Updated inventory item: ${updated.name} (${updated.code})`);
    return { success: true, message: `Inventory item "${updated.name}" updated successfully.` };
  }

  // Deletes an inventory item; throws ConflictException if referenced
  async delete(id: string): Promise<SuccessResponseDto> {
    const existing = await this.repository.findById(id);
    if (!existing) throw new NotFoundException('Inventory item not found.');

    const refs = await this.repository.countReferences(id);
    const refLabels: [number, string][] = [
      [refs.bomLines, 'BOM line'],
      [refs.conversions, 'conversion'],
      [refs.stockAdjustments, 'stock adjustment'],
      [refs.stockTransfers, 'stock transfer'],
      [refs.purchaseOrderItems, 'purchase order item'],
    ];
    const parts = refLabels.filter(([n]) => n > 0).map(([n, label]) => `${n} ${label}${n > 1 ? 's' : ''}`);
    if (parts.length > 0) {
      throw new ConflictException({
        label: 'Inventory Item In Use',
        detail: `Cannot delete "${existing.name}" — it is referenced by ${parts.join(', ')}. Remove those references first.`,
      });
    }

    await this.repository.delete(id);
    this.logger.log(`Deleted inventory item: ${existing.name} (${id})`);
    return { success: true, message: `Inventory item "${existing.name}" deleted successfully.` };
  }
}
