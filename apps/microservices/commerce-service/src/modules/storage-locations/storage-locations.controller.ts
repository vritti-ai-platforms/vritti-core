import type { StorageLocationDto } from '@domain/storage-locations/dto/entity/storage-location.dto';
import type { StorageLocationCountDto } from '@domain/storage-locations/dto/entity/storage-location-count.dto';
import type { StorageLocationTreeDto } from '@domain/storage-locations/dto/entity/storage-location-tree.dto';
import { StorageLocationsService } from '@domain/storage-locations/services/storage-locations.service';
import { Controller, Logger } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import type { SelectOptionsQueryDto, SelectQueryResult, SuccessResponseDto, TableViewState } from '@vritti/api-sdk';
import type { CreateStorageLocationDto } from './dto/request/create-storage-location.dto';
import type { ReorderStorageLocationsDto } from './dto/request/reorder-storage-locations.dto';
import type { UpdateStorageLocationDto } from './dto/request/update-storage-location.dto';

@Controller()
export class StorageLocationsController {
  private readonly logger = new Logger(StorageLocationsController.name);

  constructor(private readonly storageLocationsService: StorageLocationsService) {}

  // Returns total storage location count
  @MessagePattern({ cmd: 'storageLocations.count' })
  async count(): Promise<StorageLocationCountDto> {
    this.logger.log('storageLocations.count');
    return this.storageLocationsService.count();
  }

  // Returns storage locations as a tree hierarchy for TreeView
  @MessagePattern({ cmd: 'storageLocations.tree' })
  async tree(@Payload() data?: { search?: string }): Promise<StorageLocationTreeDto[]> {
    this.logger.log('storageLocations.tree');
    return this.storageLocationsService.findTree(data?.search);
  }

  // Returns paginated child locations for a given parent ID
  @MessagePattern({ cmd: 'storageLocations.childrenTable' })
  async childrenTable(
    @Payload() data: { parentId: string } & TableViewState,
  ): Promise<{ result: StorageLocationDto[]; count: number }> {
    this.logger.log(`storageLocations.childrenTable — parentId: ${data.parentId}`);
    return this.storageLocationsService.findChildrenForTable(data.parentId, data);
  }

  // Returns a single storage location by ID
  @MessagePattern({ cmd: 'storageLocations.findById' })
  async findById(@Payload() data: { id: string }): Promise<StorageLocationDto> {
    this.logger.log(`storageLocations.findById — id: ${data.id}`);
    return this.storageLocationsService.findById(data.id);
  }

  // Returns paginated location options for select dropdowns
  @MessagePattern({ cmd: 'storageLocations.select' })
  async select(@Payload() data: SelectOptionsQueryDto): Promise<SelectQueryResult> {
    this.logger.log('storageLocations.select');
    return this.storageLocationsService.findForSelect(data);
  }

  // Reorders siblings under a parent location
  @MessagePattern({ cmd: 'storageLocations.reorder' })
  async reorder(@Payload() data: ReorderStorageLocationsDto): Promise<SuccessResponseDto> {
    this.logger.log('storageLocations.reorder');
    return this.storageLocationsService.reorderSiblings(data.parentId ?? null, data.orderedIds);
  }

  // Creates a new storage location
  @MessagePattern({ cmd: 'storageLocations.create' })
  async create(@Payload() dto: CreateStorageLocationDto): Promise<StorageLocationDto> {
    this.logger.log(`storageLocations.create — name: ${dto.name}, code: ${dto.code}`);
    return this.storageLocationsService.create(dto);
  }

  // Updates an storage location by ID
  @MessagePattern({ cmd: 'storageLocations.update' })
  async update(@Payload() data: { id: string } & UpdateStorageLocationDto): Promise<SuccessResponseDto> {
    const { id, ...updateData } = data;
    this.logger.log(`storageLocations.update — id: ${id}`);
    return this.storageLocationsService.update(id, updateData);
  }

  // Deletes an storage location by ID
  @MessagePattern({ cmd: 'storageLocations.delete' })
  async delete(@Payload() data: { id: string }): Promise<SuccessResponseDto> {
    this.logger.log(`storageLocations.delete — id: ${data.id}`);
    return this.storageLocationsService.delete(data.id);
  }
}
