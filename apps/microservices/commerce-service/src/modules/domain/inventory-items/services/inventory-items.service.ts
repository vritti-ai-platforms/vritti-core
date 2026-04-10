import { Injectable, Logger } from '@nestjs/common';
import {
  type FieldMap,
  type FilterCondition,
  FilterProcessor,
  NotFoundException,
  type SearchState,
  type SelectQueryResult,
  type SortCondition,
} from '@vritti/api-sdk';
import { and, desc } from '@vritti/api-sdk/drizzle-orm';
import { inventoryItems } from '@/db/schema';
import { InventoryItemDetailDto, InventoryItemDto } from '../dto/entity/inventory-item.dto';
import type { CreateInventoryItemDto } from '@/modules/inventory-items/dto/request/create-inventory-item.dto';
import type { UpdateInventoryItemDto } from '@/modules/inventory-items/dto/request/update-inventory-item.dto';
import { InventoryItemsRepository } from '../repositories/inventory-items.repository';

@Injectable()
export class InventoryItemsService {
  private readonly logger = new Logger(InventoryItemsService.name);

  private static readonly FIELD_MAP: FieldMap = {
    name: { column: inventoryItems.name, type: 'string' },
    code: { column: inventoryItems.code, type: 'string' },
    type: { column: inventoryItems.type, type: 'string' },
  };

  constructor(private readonly repository: InventoryItemsRepository) {}

  // Returns paginated, filtered, and sorted inventory items for the data table
  async findForTable(params: {
    filters: FilterCondition[];
    sort: SortCondition[];
    search: SearchState | null;
    pagination: { limit: number; offset: number };
  }): Promise<{ result: InventoryItemDto[]; count: number }> {
    const filterWhere = FilterProcessor.buildWhere(params.filters, InventoryItemsService.FIELD_MAP);
    const searchWhere = FilterProcessor.buildSearch(params.search, InventoryItemsService.FIELD_MAP);
    const where = and(filterWhere, searchWhere);
    const orderBy = FilterProcessor.buildOrderBy(params.sort, InventoryItemsService.FIELD_MAP);

    const { result: rows, count } = await this.repository.findAllAndCount({
      where: where || undefined,
      orderBy: orderBy.length > 0 ? orderBy : [desc(inventoryItems.createdAt)],
      limit: params.pagination.limit,
      offset: params.pagination.offset,
    });

    const dtos: InventoryItemDto[] = [];
    for (const entity of rows) {
      const uomSymbol = await this.repository.findUomSymbol(entity.uomId);
      dtos.push(InventoryItemDto.from(entity, uomSymbol));
    }

    return { result: dtos, count };
  }

  // Returns paginated inventory item options for select dropdowns
  findForSelect(params: {
    search?: string;
    limit?: number;
    offset?: number;
    values?: string;
    excludeIds?: string;
  }): Promise<SelectQueryResult> {
    return this.repository.findForSelect({
      value: 'id',
      label: 'name',
      search: params.search,
      limit: params.limit,
      offset: params.offset,
      values: params.values,
      excludeIds: params.excludeIds,
      orderBy: { name: 'asc' },
    });
  }

  // Creates a new inventory item
  async create(data: CreateInventoryItemDto): Promise<InventoryItemDto> {
    const entity = await this.repository.create({
      name: data.name,
      code: data.code,
      type: data.type,
      description: data.description ?? null,
      uomId: data.uomId,
      requiresShipping: data.requiresShipping ?? false,
    });
    const uomSymbol = await this.repository.findUomSymbol(entity.uomId);
    this.logger.log(`Created inventory item: ${entity.name} (${entity.code})`);
    return InventoryItemDto.from(entity, uomSymbol);
  }

  // Returns inventory item detail with levels and ledger
  async findById(id: string): Promise<InventoryItemDetailDto> {
    const entity = await this.repository.findById(id);
    if (!entity) throw new NotFoundException('Inventory item not found.');
    const uomSymbol = await this.repository.findUomSymbol(entity.uomId);
    const levels = await this.repository.findLevelsByItemId(id);
    const ledger = await this.repository.findLedgerByItemId(id);
    return InventoryItemDetailDto.fromDetail(entity, uomSymbol, levels, ledger);
  }

  // Updates an inventory item
  async update(id: string, data: UpdateInventoryItemDto): Promise<InventoryItemDto> {
    const existing = await this.repository.findById(id);
    if (!existing) throw new NotFoundException('Inventory item not found.');

    const updatePayload: Record<string, unknown> = {};
    if (data.name !== undefined) updatePayload.name = data.name;
    if (data.code !== undefined) updatePayload.code = data.code;
    if (data.type !== undefined) updatePayload.type = data.type;
    if (data.description !== undefined) updatePayload.description = data.description;
    if (data.uomId !== undefined) updatePayload.uomId = data.uomId;
    if (data.requiresShipping !== undefined) updatePayload.requiresShipping = data.requiresShipping;

    const entity = await this.repository.update(id, updatePayload);
    const uomSymbol = await this.repository.findUomSymbol(entity.uomId);
    this.logger.log(`Updated inventory item: ${entity.name} (${entity.id})`);
    return InventoryItemDto.from(entity, uomSymbol);
  }

  // Deletes an inventory item (cascades to levels and ledger)
  async delete(id: string): Promise<{ success: boolean; message: string }> {
    const existing = await this.repository.findById(id);
    if (!existing) throw new NotFoundException('Inventory item not found.');
    await this.repository.delete(id);
    this.logger.log(`Deleted inventory item: ${id}`);
    return { success: true, message: 'Inventory item deleted successfully.' };
  }
}
