import { Injectable, Logger } from '@nestjs/common';
import {
  ConflictException,
  type CreateResponseDto,
  type FieldMap,
  type FilterCondition,
  FilterProcessor,
  NotFoundException,
  type SearchState,
  type SelectOptionsQueryDto,
  type SelectQueryResult,
  type SortCondition,
  type SuccessResponseDto,
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

    const referencedIds = await this.repository.findReferencedIds(rows.map((r) => r.id));
    const dtos = rows.map((entity) => InventoryItemDto.from(entity, null, !referencedIds.has(entity.id)));

    return { result: dtos, count };
  }

  // Returns paginated inventory item options for select dropdowns
  findForSelect(query: SelectOptionsQueryDto): Promise<SelectQueryResult> {
    return this.repository.findForSelect({
      value: query.valueKey || 'id',
      label: query.labelKey || 'name',
      description: query.descriptionKey,
      groupId: query.groupIdKey,
      search: query.search,
      limit: query.limit,
      offset: query.offset,
      values: query.values,
      excludeIds: query.excludeIds,
      orderBy: { name: 'asc' },
    });
  }

  // Creates a new inventory item
  async create(data: CreateInventoryItemDto): Promise<CreateResponseDto<InventoryItemDto>> {
    const entity = await this.repository.create({
      name: data.name,
      code: data.code,
      type: data.type,
      description: data.description ?? null,
      uomId: data.uomId,
    });
    const uomSymbol = await this.repository.findUomSymbol(entity.uomId);
    this.logger.log(`Created inventory item: ${entity.name} (${entity.code})`);
    return { success: true, message: `Item "${entity.name}" (${entity.code}) created successfully.`, data: InventoryItemDto.from(entity, uomSymbol) };
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
  async update(id: string, data: UpdateInventoryItemDto): Promise<SuccessResponseDto> {
    const existing = await this.repository.findById(id);
    if (!existing) throw new NotFoundException('Inventory item not found.');

    const updatePayload: Record<string, unknown> = {};
    if (data.name !== undefined) updatePayload.name = data.name;
    if (data.code !== undefined) updatePayload.code = data.code;
    if (data.type !== undefined) updatePayload.type = data.type;
    if (data.description !== undefined) updatePayload.description = data.description;
    if (data.uomId !== undefined) updatePayload.uomId = data.uomId;

    if (Object.keys(updatePayload).length > 0) {
      await this.repository.update(id, updatePayload);
    }

    this.logger.log(`Updated inventory item: ${existing.name} (${existing.code})`);
    return { success: true, message: `Item "${existing.name}" updated successfully.` };
  }

  // Deletes an inventory item; throws ConflictException if referenced
  async delete(id: string): Promise<SuccessResponseDto> {
    const existing = await this.repository.findById(id);
    if (!existing) throw new NotFoundException('Inventory item not found.');
    const refs = await this.repository.countReferences(id);
    const parts: string[] = [];
    if (refs.bomLines > 0) parts.push(`${refs.bomLines} BOM line${refs.bomLines > 1 ? 's' : ''}`);
    if (refs.conversions > 0) parts.push(`${refs.conversions} conversion${refs.conversions > 1 ? 's' : ''}`);
    if (refs.stockAdjustments > 0) parts.push(`${refs.stockAdjustments} stock adjustment${refs.stockAdjustments > 1 ? 's' : ''}`);
    if (refs.stockTransfers > 0) parts.push(`${refs.stockTransfers} stock transfer${refs.stockTransfers > 1 ? 's' : ''}`);
    if (refs.purchaseOrderItems > 0) parts.push(`${refs.purchaseOrderItems} purchase order item${refs.purchaseOrderItems > 1 ? 's' : ''}`);
    if (parts.length > 0) {
      throw new ConflictException({
        label: 'Item In Use',
        detail: `Cannot delete "${existing.name}" — it is referenced by ${parts.join(', ')}. Remove those references first.`,
      });
    }
    await this.repository.delete(id);
    this.logger.log(`Deleted inventory item: ${existing.name} (${id})`);
    return { success: true, message: `Item "${existing.name}" deleted successfully.` };
  }
}
