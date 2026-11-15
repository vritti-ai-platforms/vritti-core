import type { StorageTypeDto } from '@domain/storage-types/dto/entity/storage-type.dto';
import { CreateStorageTypeDto } from '@domain/storage-types/dto/request/create-storage-type.dto';
import { UpdateStorageTypeDto } from '@domain/storage-types/dto/request/update-storage-type.dto';
import { StorageTypesDomainService } from '@domain/storage-types/services/storage-types.service';
import { Controller, Logger } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import type { TableState } from '@vritti/api-sdk/data-table';
import type { CreateResponseDto, SuccessResponseDto } from '@vritti/api-sdk/responses';

@Controller()
export class StorageTypesRootController {
  private readonly logger = new Logger(StorageTypesRootController.name);

  constructor(private readonly service: StorageTypesDomainService) {}

  // Returns paginated storage types with their location and item counts
  @MessagePattern({ cmd: 'org.storageTypes.table' })
  async table(@Payload() state: TableState): Promise<{ result: StorageTypeDto[]; count: number }> {
    this.logger.log('storageTypes.table');
    return this.service.findForTable(state);
  }

  // Returns a single storage type by ID
  @MessagePattern({ cmd: 'org.storageTypes.findById' })
  async findById(@Payload() data: { id: string }): Promise<StorageTypeDto> {
    this.logger.log(`storageTypes.findById — id: ${data.id}`);
    return this.service.findById(data.id);
  }

  // Creates a storage type
  @MessagePattern({ cmd: 'org.storageTypes.create' })
  async create(@Payload() dto: CreateStorageTypeDto): Promise<CreateResponseDto<StorageTypeDto>> {
    this.logger.log(`storageTypes.create — code: ${dto.code}, name: ${dto.name}`);
    return this.service.create(dto);
  }

  // Updates a storage type's code, name, limits or rules
  @MessagePattern({ cmd: 'org.storageTypes.update' })
  async update(@Payload() dto: UpdateStorageTypeDto): Promise<SuccessResponseDto> {
    const { id, ...payload } = dto;
    this.logger.log(`storageTypes.update — id: ${id}`);
    return this.service.update(id, payload);
  }

  // Deletes a storage type no location or item references
  @MessagePattern({ cmd: 'org.storageTypes.delete' })
  async delete(@Payload() data: { id: string }): Promise<SuccessResponseDto> {
    this.logger.log(`storageTypes.delete — id: ${data.id}`);
    return this.service.delete(data.id);
  }
}
