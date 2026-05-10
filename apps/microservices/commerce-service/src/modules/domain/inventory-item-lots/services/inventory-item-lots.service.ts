import { Injectable, Logger } from '@nestjs/common';
import {
  BadRequestException,
  type FieldMap,
  FilterProcessor,
  type SelectOptionsQueryDto,
  type SelectQueryResult,
  type TableViewState,
} from '@vritti/api-sdk';
import { and, ilike } from '@vritti/api-sdk/drizzle-orm';
import { type InventoryItemLot, inventoryItemLots } from '@/db/schema';
import { InventoryItemLotDto } from '../dto/entity/inventory-item-lot.dto';
import { InventoryItemLotsRepository } from '../repositories/inventory-item-lots.repository';

@Injectable()
export class InventoryItemLotsService {
  private readonly logger = new Logger(InventoryItemLotsService.name);

  private static readonly LOTS_FIELD_MAP: FieldMap = {
    lotNumber: { column: inventoryItemLots.lotNumber, type: 'string' },
    expiryDate: { column: inventoryItemLots.expiryDate, type: 'string' },
    manufacturingDate: { column: inventoryItemLots.manufacturingDate, type: 'string' },
  };

  constructor(private readonly repository: InventoryItemLotsRepository) {}

  async findLotsForTable(
    itemId: string,
    state: TableViewState,
  ): Promise<{ result: InventoryItemLotDto[]; count: number }> {
    const filterWhere = FilterProcessor.buildWhere(state.filters, InventoryItemLotsService.LOTS_FIELD_MAP);
    const searchWhere = FilterProcessor.buildSearch(state.search, InventoryItemLotsService.LOTS_FIELD_MAP);
    const where = and(filterWhere, searchWhere) || undefined;
    const orderBy = FilterProcessor.buildOrderBy(state.sort, InventoryItemLotsService.LOTS_FIELD_MAP);
    const { limit = 20, offset = 0 } = state.pagination;

    const { result, count } = await this.repository.findLotsForTable(itemId, {
      where,
      orderBy: orderBy.length > 0 ? orderBy : undefined,
      limit,
      offset,
    });

    return { result: result.map((row) => InventoryItemLotDto.from(row)), count };
  }

  // Returns existing lot or creates a new one. Lot identity is (orgId, itemId, lotNumber).
  async findOrCreateLot(params: {
    inventoryItemId: string;
    lotNumber: string;
    manufacturingDate?: string | null;
    expiryDate: string;
  }): Promise<InventoryItemLot> {
    const existing = await this.repository.findByItemAndNumber(params.inventoryItemId, params.lotNumber);
    if (existing) return existing;

    return this.repository.createLot({
      inventoryItemId: params.inventoryItemId,
      lotNumber: params.lotNumber,
      manufacturingDate: params.manufacturingDate ?? null,
      expiryDate: params.expiryDate,
    });
  }

  // Returns the inventory lot for an item if one already exists with this lot number.
  // Used by adjustment flows to detect duplicates before registering OPENING_STOCK lots.
  findByItemAndNumber(inventoryItemId: string, lotNumber: string): Promise<InventoryItemLot | undefined> {
    return this.repository.findByItemAndNumber(inventoryItemId, lotNumber);
  }

  // Creates a new inventory lot. Used by the publish flow when resolving draft adjustment lots.
  createLot(data: {
    inventoryItemId: string;
    lotNumber: string;
    manufacturingDate?: string | null;
    expiryDate: string;
  }): Promise<InventoryItemLot> {
    return this.repository.createLot({
      inventoryItemId: data.inventoryItemId,
      lotNumber: data.lotNumber,
      manufacturingDate: data.manufacturingDate ?? null,
      expiryDate: data.expiryDate,
    });
  }

  // Returns paginated lot options for the select component
  async findForSelect(query: SelectOptionsQueryDto & { inventoryItemId: string }): Promise<SelectQueryResult> {
    if (!query.inventoryItemId) throw new BadRequestException('inventoryItemId is required.');
    const search = query.search?.trim();
    return this.repository.findForSelect({
      value: query.valueKey || 'id',
      label: query.labelKey || 'lotNumber',
      description: query.descriptionKey,
      additionalKeys: query.additionalKeys,
      values: query.values,
      excludeIds: query.excludeIds,
      limit: query.limit,
      offset: query.offset,
      orderByKey: query.orderByKey || 'createdAt',
      orderDirection: query.orderDirection || 'desc',
      where: { inventoryItemId: query.inventoryItemId },
      conditions: search ? [ilike(inventoryItemLots.lotNumber, `%${search}%`)] : undefined,
    });
  }
}
