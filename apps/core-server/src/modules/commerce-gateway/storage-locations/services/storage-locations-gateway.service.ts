import { Injectable, Logger } from '@nestjs/common';
import { DataTableStateService, NatsClientService, type SelectQueryResult, type SuccessResponseDto } from '@vritti/api-sdk';
import type { SelectOptionsQueryDto } from '@vritti/api-sdk';
import type { CreateStorageLocationDto } from '../dto/request/create-storage-location.dto';
import type { ReorderStorageLocationsDto } from '../dto/request/reorder-storage-locations.dto';
import type { UpdateStorageLocationDto } from '../dto/request/update-storage-location.dto';
import type { StorageLocationChildrenTableResponseDto } from '../dto/response/storage-location-children-table-response.dto';
import type { StorageLocationCountResponseDto } from '../dto/response/storage-location-count-response.dto';
import type { StorageLocationResponseDto } from '../dto/response/storage-location-response.dto';
import type { StorageLocationTreeResponseDto } from '../dto/response/storage-location-tree-response.dto';

@Injectable()
export class StorageLocationsGatewayService {
  private readonly logger = new Logger(StorageLocationsGatewayService.name);

  constructor(
    private readonly nats: NatsClientService,
    private readonly dataTableStateService: DataTableStateService,
  ) {}

  // Returns total storage location count
  async count(): Promise<StorageLocationCountResponseDto> {
    this.logger.log('storageLocations.count');
    return this.nats.send('commerce', 'storageLocations.count', {});
  }

  // Returns storage locations as a tree hierarchy
  async findTree(search?: string): Promise<StorageLocationTreeResponseDto[]> {
    this.logger.log('storageLocations.tree');
    return this.nats.send('commerce', 'storageLocations.tree', { search });
  }

  // Returns paginated child locations for a given parent ID
  async findChildrenForTable(userId: string, parentId: string): Promise<StorageLocationChildrenTableResponseDto> {
    this.logger.log(`storageLocations.childrenTable — parentId: ${parentId}`);
    const slug = `storage-locations-children-${parentId}`;
    const { state, activeViewId } = await this.dataTableStateService.getCurrentState(userId, slug);
    const { result, count } = await this.nats.send<{ result: StorageLocationResponseDto[]; count: number }>(
      'commerce',
      'storageLocations.childrenTable',
      { parentId, ...state },
    );
    return { result, count, state, activeViewId };
  }

  // Returns a single storage location by ID
  async findById(id: string): Promise<StorageLocationResponseDto> {
    this.logger.log(`storageLocations.findById — id: ${id}`);
    return this.nats.send('commerce', 'storageLocations.findById', { id });
  }

  // Returns paginated location options for select dropdowns
  async select(params: SelectOptionsQueryDto): Promise<SelectQueryResult> {
    this.logger.log('storageLocations.select');
    return this.nats.send('commerce', 'storageLocations.select', params);
  }

  // Reorders sibling locations under a parent
  async reorder(dto: ReorderStorageLocationsDto): Promise<SuccessResponseDto> {
    this.logger.log('storageLocations.reorder');
    return this.nats.send('commerce', 'storageLocations.reorder', dto);
  }

  // Creates a new storage location
  async create(dto: CreateStorageLocationDto): Promise<StorageLocationResponseDto> {
    this.logger.log(`storageLocations.create — name: ${dto.name}, code: ${dto.code}`);
    return this.nats.send('commerce', 'storageLocations.create', dto);
  }

  // Updates an storage location by ID
  async update(id: string, dto: UpdateStorageLocationDto): Promise<SuccessResponseDto> {
    this.logger.log(`storageLocations.update — id: ${id}`);
    return this.nats.send('commerce', 'storageLocations.update', { id, ...dto });
  }

  // Deletes an storage location by ID
  async delete(id: string): Promise<SuccessResponseDto> {
    this.logger.log(`storageLocations.delete — id: ${id}`);
    return this.nats.send('commerce', 'storageLocations.delete', { id });
  }
}
