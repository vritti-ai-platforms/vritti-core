import type { StorageLocationDto } from '@domain/storage-locations/dto/entity/storage-location.dto';
import type { LocationStockDto } from '@domain/storage-locations/dto/entity/storage-location.dto';
import { StorageLocationsService } from '@domain/storage-locations/services/storage-locations.service';
import { Controller, Logger } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import type { CreateResponseDto, SelectOptionsQueryDto, SelectQueryResult, SuccessResponseDto } from '@vritti/api-sdk';
import type { CreateStorageLocationDto } from './dto/request/create-storage-location.dto';
import type { UpdateStorageLocationDto } from './dto/request/update-storage-location.dto';

@Controller()
export class StorageLocationsController {
  private readonly logger = new Logger(StorageLocationsController.name);

  constructor(private readonly storageLocationsService: StorageLocationsService) {}

  // Returns all storage locations
  @MessagePattern({ cmd: 'storageLocations.list' })
  async list(): Promise<StorageLocationDto[]> {
    this.logger.log('storageLocations.list');
    return this.storageLocationsService.findAll();
  }

  // Returns a single storage location by ID
  @MessagePattern({ cmd: 'storageLocations.findById' })
  async findById(@Payload() data: { id: string }): Promise<StorageLocationDto> {
    this.logger.log(`storageLocations.findById — id: ${data.id}`);
    return this.storageLocationsService.findById(data.id);
  }

  // Returns stock levels at a location
  @MessagePattern({ cmd: 'storageLocations.levels' })
  async levels(@Payload() data: { locationId: string }): Promise<LocationStockDto[]> {
    this.logger.log(`storageLocations.levels — locationId: ${data.locationId}`);
    return this.storageLocationsService.findLevels(data.locationId);
  }

  // Returns paginated location options for select dropdowns
  @MessagePattern({ cmd: 'storageLocations.select' })
  async select(@Payload() data: SelectOptionsQueryDto): Promise<SelectQueryResult> {
    this.logger.log('storageLocations.select');
    return this.storageLocationsService.findForSelect(data);
  }

  // Creates a new storage location
  @MessagePattern({ cmd: 'storageLocations.create' })
  async create(@Payload() dto: CreateStorageLocationDto): Promise<CreateResponseDto<StorageLocationDto>> {
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
