import { Injectable, Logger } from '@nestjs/common';
import {
  type CreateResponseDto,
  CursorCodec,
  type FieldMap,
  FilterProcessor,
  type KeysetOrderBy,
  KeysetProcessor,
  type SuccessResponseDto,
  type TableViewState,
} from '@vritti/api-sdk/database';
import { and, asc, desc, eq } from '@vritti/api-sdk/drizzle-orm';
import { ConflictException, NotFoundException } from '@vritti/api-sdk/exceptions';
import { inventoryItemLocations, locations } from '@/db/schema';
import { InventoryItemLocationDto } from '../dto/entity/inventory-item-location.dto';
import { InventoryItemLocationsDomainRepository } from '../repositories/inventory-item-locations.repository';

@Injectable()
export class InventoryItemLocationsDomainService {
  private readonly logger = new Logger(InventoryItemLocationsDomainService.name);

  private static readonly FIELD_MAP: FieldMap = {
    locationName: { column: locations.name, type: 'string' },
    reorderLevel: { column: inventoryItemLocations.minLevel, type: 'string' },
  };

  constructor(private readonly repository: InventoryItemLocationsDomainRepository) {}

  // Returns paginated, filtered, and sorted configs for an inventory item
  async findForTable(
    inventoryItemId: string,
    state: TableViewState,
  ): Promise<{ result: InventoryItemLocationDto[]; count: number }> {
    const filterWhere = FilterProcessor.buildWhere(state.filters, InventoryItemLocationsDomainService.FIELD_MAP);
    const searchWhere = FilterProcessor.buildSearch(state.search, InventoryItemLocationsDomainService.FIELD_MAP);
    const where = and(filterWhere, searchWhere) || undefined;
    const orderBy = FilterProcessor.buildOrderBy(state.sort, InventoryItemLocationsDomainService.FIELD_MAP);
    const { limit = 20, offset = 0 } = state.pagination;

    const { result, count } = await this.repository.findByInventoryItemId(inventoryItemId, {
      where,
      orderBy: orderBy.length > 0 ? orderBy : [desc(inventoryItemLocations.createdAt)],
      limit,
      offset,
    });

    return { result: result.map(InventoryItemLocationDto.from), count };
  }

  // Keyset feed for the mobile Relay locations list. Ordered by (locationName asc, id asc); the cursor
  // encodes those boundary values (via CursorCodec) so pages don't skip/duplicate.
  async findLocationsFeed(
    inventoryItemId: string,
    limit: number,
    cursor?: string,
  ): Promise<{
    edges: { cursor: string; node: InventoryItemLocationDto }[];
    pageInfo: { hasNextPage: boolean; endCursor: string | null };
  }> {
    const orderByEntries: (KeysetOrderBy & { key: string })[] = [
      { column: locations.name, direction: 'asc', key: 'locationName' },
      { column: inventoryItemLocations.id, direction: 'asc', key: 'id' },
    ];
    const orderBy = orderByEntries.map((e) => (e.direction === 'asc' ? asc(e.column) : desc(e.column)));
    const cursorWhere = cursor ? KeysetProcessor.buildAfter(orderByEntries, CursorCodec.decode(cursor)) : undefined;
    const where = and(eq(inventoryItemLocations.inventoryItemId, inventoryItemId), cursorWhere);

    const { rows, hasMore } = await this.repository.findLocationsFeedKeyset({ where, orderBy, limit });
    const edges = rows.map((row) => ({
      cursor: CursorCodec.encode(orderByEntries.map((e) => (row as Record<string, unknown>)[e.key])),
      node: InventoryItemLocationDto.from(row),
    }));
    return {
      edges,
      pageInfo: { hasNextPage: hasMore, endCursor: edges.length > 0 ? edges[edges.length - 1].cursor : null },
    };
  }

  // Creates a new config for an item at a location
  async create(
    inventoryItemId: string,
    data: { locationId: string; reorderLevel: number },
  ): Promise<CreateResponseDto<InventoryItemLocationDto>> {
    const existing = await this.repository.findByCompositeKey(inventoryItemId, data.locationId);
    if (existing) throw new ConflictException('A configuration already exists for this item at this location.');

    const entity = await this.repository.create({
      inventoryItemId: inventoryItemId,
      locationId: data.locationId,
      minLevel: data.reorderLevel,
    });

    const row = await this.repository.findByIdWithLocation(entity.id);
    this.logger.log(`Created item-location config for item ${inventoryItemId} at location ${data.locationId}`);
    return {
      success: true,
      message: 'Item location configuration created successfully.',
      data: InventoryItemLocationDto.from(row ?? { ...entity, locationName: null }),
    };
  }

  // Updates the reorder level of an existing config
  async update(id: string, data: { reorderLevel: number }): Promise<SuccessResponseDto> {
    const existing = await this.repository.findByIdWithLocation(id);
    if (!existing) throw new NotFoundException('Item location configuration not found.');

    await this.repository.update(id, { minLevel: data.reorderLevel });
    this.logger.log(`Updated item-location config ${id} — reorderLevel: ${data.reorderLevel}`);

    return { success: true, message: 'Reorder level updated successfully.' };
  }

  // Deletes an item-location config
  async delete(id: string): Promise<SuccessResponseDto> {
    const existing = await this.repository.findByIdWithLocation(id);
    if (!existing) throw new NotFoundException('Item location configuration not found.');

    await this.repository.delete(id);
    this.logger.log(`Deleted item-location config ${id}`);
    const locationLabel = existing.locationName ?? existing.locationId;
    return { success: true, message: `Item location configuration for "${locationLabel}" deleted successfully.` };
  }
}
