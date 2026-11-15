import { Injectable, Logger } from '@nestjs/common';
import { type FieldMap, FilterProcessor } from '@vritti/api-sdk/conditions';
import { CursorCodec, type KeysetOrderBy, KeysetProcessor, type TableState } from '@vritti/api-sdk/data-table';
import { and, asc, desc, eq } from '@vritti/api-sdk/drizzle-orm';
import { ConflictException, NotFoundException } from '@vritti/api-sdk/exceptions';
import type { CreateResponseDto, SuccessResponseDto } from '@vritti/api-sdk/responses';
import { inventoryItemLocations, locations } from '@/db/schema';
import { InventoryItemLocationDto } from '../dto/entity/inventory-item-location.dto';
import { InventoryItemLocationsDomainRepository } from '../repositories/inventory-item-locations.repository';

@Injectable()
export class InventoryItemLocationsDomainService {
  private readonly logger = new Logger(InventoryItemLocationsDomainService.name);

  private static readonly FIELD_MAP: FieldMap = {
    locationName: { column: locations.name, type: 'string' },
    isBlocked: { column: inventoryItemLocations.isBlocked, type: 'boolean' },
  };

  constructor(private readonly repository: InventoryItemLocationsDomainRepository) {}

  // Creates a new config for an item at a location
  async create(
    inventoryItemId: string,
    data: { locationId: string; isBlocked?: boolean },
  ): Promise<CreateResponseDto<InventoryItemLocationDto>> {
    const existing = await this.repository.findByCompositeKey(inventoryItemId, data.locationId);
    if (existing) throw new ConflictException('A configuration already exists for this item at this location.');

    const entity = await this.repository.create({
      inventoryItemId: inventoryItemId,
      locationId: data.locationId,
      isBlocked: data.isBlocked,
    });

    const row = await this.repository.findByIdWithLocation(entity.id);
    this.logger.log(`Created item-location config for item ${inventoryItemId} at location ${data.locationId}`);
    return {
      success: true,
      message: 'Item location configuration created successfully.',
      data: InventoryItemLocationDto.from(row ?? { ...entity, locationName: null }),
    };
  }

  // Blocks or unblocks new putaway of the item into this fixed location
  async update(id: string, data: { isBlocked: boolean }): Promise<SuccessResponseDto> {
    const existing = await this.repository.findByIdWithLocation(id);
    if (!existing) throw new NotFoundException('Item location configuration not found.');

    await this.repository.update(id, { isBlocked: data.isBlocked });
    this.logger.log(`Updated item-location config ${id} — isBlocked: ${data.isBlocked}`);

    const locationLabel = existing.locationName ?? existing.locationId;
    return {
      success: true,
      message: data.isBlocked
        ? `"${locationLabel}" is now blocked for this item.`
        : `"${locationLabel}" is now unblocked for this item.`,
    };
  }

  // Returns paginated, filtered, and sorted configs for an inventory item
  async findForTable(
    inventoryItemId: string,
    state: TableState,
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

  // Keyset feed for the mobile Relay locations list.
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
