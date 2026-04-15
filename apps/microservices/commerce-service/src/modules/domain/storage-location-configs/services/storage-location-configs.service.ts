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
import { storageLocationConfigs, storageLocations } from '@/db/schema';
import { StorageLocationConfigDto } from '../dto/entity/storage-location-config.dto';
import { StorageLocationConfigsRepository } from '../repositories/storage-location-configs.repository';

@Injectable()
export class StorageLocationConfigsService {
  private readonly logger = new Logger(StorageLocationConfigsService.name);

  private static readonly FIELD_MAP: FieldMap = {
    locationName: { column: storageLocations.name, type: 'string' },
    reorderLevel: { column: storageLocationConfigs.reorderLevel, type: 'string' },
  };

  constructor(private readonly repository: StorageLocationConfigsRepository) {}

  // Returns paginated, filtered, and sorted configs for an inventory item
  async findForTable(
    itemId: string,
    state: TableViewState,
  ): Promise<{ result: StorageLocationConfigDto[]; count: number }> {
    const filterWhere = FilterProcessor.buildWhere(state.filters, StorageLocationConfigsService.FIELD_MAP);
    const searchWhere = FilterProcessor.buildSearch(state.search, StorageLocationConfigsService.FIELD_MAP);
    const where = and(filterWhere, searchWhere) || undefined;
    const orderBy = FilterProcessor.buildOrderBy(state.sort, StorageLocationConfigsService.FIELD_MAP);
    const { limit = 20, offset = 0 } = state.pagination;

    const { result, count } = await this.repository.findByItemId(itemId, {
      where,
      orderBy: orderBy.length > 0 ? orderBy : [desc(storageLocationConfigs.createdAt)],
      limit,
      offset,
    });

    return { result: result.map(StorageLocationConfigDto.from), count };
  }

  // Creates a new config for an item at a location
  async create(
    itemId: string,
    data: { locationId: string; reorderLevel: number },
  ): Promise<CreateResponseDto<StorageLocationConfigDto>> {
    const existing = await this.repository.findByCompositeKey(itemId, data.locationId);
    if (existing) throw new ConflictException('A configuration already exists for this item at this location.');

    const entity = await this.repository.create({
      inventoryItemId: itemId,
      locationId: data.locationId,
      reorderLevel: String(data.reorderLevel),
    });

    const row = await this.repository.findByIdWithLocation(entity.id);
    this.logger.log(`Created storage location config for item ${itemId} at location ${data.locationId}`);
    return {
      success: true,
      message: 'Storage location configuration created successfully.',
      data: StorageLocationConfigDto.from(row ?? { ...entity, locationName: null }),
    };
  }

  // Updates the reorder level of an existing config
  async update(id: string, data: { reorderLevel: number }): Promise<SuccessResponseDto> {
    const existing = await this.repository.findByIdWithLocation(id);
    if (!existing) throw new NotFoundException('Storage location configuration not found.');

    await this.repository.update(id, { reorderLevel: String(data.reorderLevel) });
    this.logger.log(`Updated storage location config ${id} — reorderLevel: ${data.reorderLevel}`);

    return { success: true, message: 'Reorder level updated successfully.' };
  }

  // Deletes a storage location config
  async delete(id: string): Promise<SuccessResponseDto> {
    const existing = await this.repository.findByIdWithLocation(id);
    if (!existing) throw new NotFoundException('Storage location configuration not found.');

    await this.repository.delete(id);
    this.logger.log(`Deleted storage location config ${id}`);
    const locationLabel = existing.locationName ?? existing.locationId;
    return { success: true, message: `Storage location configuration for "${locationLabel}" deleted successfully.` };
  }
}
