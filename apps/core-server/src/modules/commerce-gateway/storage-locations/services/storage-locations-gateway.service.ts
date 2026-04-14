import { Injectable, Logger } from '@nestjs/common';
import { type CreateResponseDto, NatsClientService, type SelectQueryResult, type SuccessResponseDto } from '@vritti/api-sdk';
import type { SelectOptionsQueryDto } from '@vritti/api-sdk';
import type { CreateStorageLocationDto } from '../dto/request/create-storage-location.dto';
import type { UpdateStorageLocationDto } from '../dto/request/update-storage-location.dto';
import type { StorageLocationResponseDto } from '../dto/response/storage-location-response.dto';

@Injectable()
export class StorageLocationsGatewayService {
  private readonly logger = new Logger(StorageLocationsGatewayService.name);

  constructor(private readonly nats: NatsClientService) {}

  // Returns all storage locations
  async findAll(): Promise<StorageLocationResponseDto[]> {
    this.logger.log('storageLocations.list');
    return this.nats.send('commerce', 'storageLocations.list', {});
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

  // Creates a new storage location
  async create(dto: CreateStorageLocationDto): Promise<CreateResponseDto<StorageLocationResponseDto>> {
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
