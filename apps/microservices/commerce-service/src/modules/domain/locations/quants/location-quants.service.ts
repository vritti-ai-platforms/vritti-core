import { Injectable, Logger } from '@nestjs/common';
import { type FieldMap, FilterProcessor, type TableViewState } from '@vritti/api-sdk';
import { and } from '@vritti/api-sdk/drizzle-orm';
import { inventoryItems } from '@/db/schema';
import { LocationItemQuantDto } from './dto/entity/location-item-quant.dto';
import { LocationItemDto } from './dto/entity/location-item.dto';
import { LocationQuantsRepository } from './location-quants.repository';

@Injectable()
export class LocationQuantsService {
  private readonly logger = new Logger(LocationQuantsService.name);

  // Search/sort is on the joined inventory item name + code.
  private static readonly ITEMS_FIELD_MAP: FieldMap = {
    itemName: { column: inventoryItems.name, type: 'string' },
    itemCode: { column: inventoryItems.code, type: 'string' },
  };

  constructor(private readonly repository: LocationQuantsRepository) {}

  // Returns a location's items (grouped, non-zero), table-shaped with FilterProcessor search/sort.
  async findItemsForTable(
    locationId: string,
    state: TableViewState,
  ): Promise<{ result: LocationItemDto[]; count: number }> {
    this.logger.log(`findItemsForTable — locationId=${locationId}`);
    const filterWhere = FilterProcessor.buildWhere(state.filters, LocationQuantsService.ITEMS_FIELD_MAP);
    const searchWhere = FilterProcessor.buildSearch(state.search, LocationQuantsService.ITEMS_FIELD_MAP);
    const where = and(filterWhere, searchWhere) || undefined;
    const orderBy = FilterProcessor.buildOrderBy(state.sort, LocationQuantsService.ITEMS_FIELD_MAP);
    const { limit = 20, offset = 0 } = state.pagination;

    const { result, count } = await this.repository.findItemsForLocation(locationId, {
      where,
      orderBy: orderBy.length > 0 ? orderBy : undefined,
      limit,
      offset,
    });

    return { result: result.map((row) => LocationItemDto.from(row)), count };
  }

  // Returns the per-quant breakdown for a single item within a location.
  async findBreakdown(locationId: string, itemId: string): Promise<LocationItemQuantDto[]> {
    this.logger.log(`findBreakdown — locationId=${locationId}, itemId=${itemId}`);
    const rows = await this.repository.findBreakdown(locationId, itemId);
    return rows.map((row) => LocationItemQuantDto.from(row));
  }
}
