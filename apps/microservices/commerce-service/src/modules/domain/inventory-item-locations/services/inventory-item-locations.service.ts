import { Injectable, Logger } from '@nestjs/common';
import {
  ConflictException,
  type CreateResponseDto,
  type FieldMap,
  FilterProcessor,
  NotFoundException,
  type SuccessResponseDto,
  type TableViewState,
} from '@vritti/api-sdk';
import { and, desc } from '@vritti/api-sdk/drizzle-orm';
import { inventoryItemLocations, locations } from '@/db/schema';
import { InventoryItemLocationDto } from '../dto/entity/inventory-item-location.dto';
import { InventoryItemLocationsRepository } from '../repositories/inventory-item-locations.repository';

@Injectable()
export class InventoryItemLocationsService {
  private readonly logger = new Logger(InventoryItemLocationsService.name);

  private static readonly FIELD_MAP: FieldMap = {
    locationName: { column: locations.name, type: 'string' },
    reorderLevel: { column: inventoryItemLocations.reorderLevel, type: 'string' },
  };

  constructor(private readonly repository: InventoryItemLocationsRepository) {}

  // Returns paginated, filtered, and sorted configs for an inventory item
  async findForTable(
    itemId: string,
    state: TableViewState,
  ): Promise<{ result: InventoryItemLocationDto[]; count: number }> {
    const filterWhere = FilterProcessor.buildWhere(state.filters, InventoryItemLocationsService.FIELD_MAP);
    const searchWhere = FilterProcessor.buildSearch(state.search, InventoryItemLocationsService.FIELD_MAP);
    const where = and(filterWhere, searchWhere) || undefined;
    const orderBy = FilterProcessor.buildOrderBy(state.sort, InventoryItemLocationsService.FIELD_MAP);
    const { limit = 20, offset = 0 } = state.pagination;

    const { result, count } = await this.repository.findByItemId(itemId, {
      where,
      orderBy: orderBy.length > 0 ? orderBy : [desc(inventoryItemLocations.createdAt)],
      limit,
      offset,
    });

    return { result: result.map(InventoryItemLocationDto.from), count };
  }

  // Creates a new config for an item at a location
  async create(
    itemId: string,
    data: { locationId: string; reorderLevel: number },
  ): Promise<CreateResponseDto<InventoryItemLocationDto>> {
    const existing = await this.repository.findByCompositeKey(itemId, data.locationId);
    if (existing) throw new ConflictException('A configuration already exists for this item at this location.');

    const entity = await this.repository.create({
      inventoryItemId: itemId,
      locationId: data.locationId,
      reorderLevel: String(data.reorderLevel),
    });

    const row = await this.repository.findByIdWithLocation(entity.id);
    this.logger.log(`Created item-location config for item ${itemId} at location ${data.locationId}`);
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

    await this.repository.update(id, { reorderLevel: String(data.reorderLevel) });
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
