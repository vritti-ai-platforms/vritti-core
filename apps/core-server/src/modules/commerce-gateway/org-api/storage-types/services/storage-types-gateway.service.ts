import type { CreateStorageTypeDto } from '@commerce/storage-types/dto/request/create-storage-type.dto';
import type { UpdateStorageTypeDto } from '@commerce/storage-types/dto/request/update-storage-type.dto';
import type { StorageTypeResponseDto } from '@commerce/storage-types/dto/response/storage-type-response.dto';
import type { StorageTypeTableResponseDto } from '@commerce/storage-types/dto/response/storage-type-table-response.dto';
import { Injectable, Logger } from '@nestjs/common';
import { TableStateService } from '@vritti/api-sdk/data-table';
import { NatsClientService } from '@vritti/api-sdk/nats';
import type { CreateResponseDto, SuccessResponseDto } from '@vritti/api-sdk/responses';

@Injectable()
export class StorageTypesGatewayService {
  private readonly logger = new Logger(StorageTypesGatewayService.name);

  constructor(
    private readonly nats: NatsClientService,
    private readonly tableStateService: TableStateService,
  ) {}

  // Creates a new storage type
  create(dto: CreateStorageTypeDto): Promise<CreateResponseDto<StorageTypeResponseDto>> {
    this.logger.log(`org.storageTypes.create — code: ${dto.code}`);
    return this.nats.send('commerce', 'org.storageTypes.create', dto);
  }

  // Updates a storage type by ID
  update(id: string, dto: UpdateStorageTypeDto): Promise<SuccessResponseDto> {
    this.logger.log(`org.storageTypes.update — id: ${id}`);
    return this.nats.send('commerce', 'org.storageTypes.update', { id, ...dto });
  }

  // Finds a storage type by ID
  findById(id: string): Promise<StorageTypeResponseDto> {
    this.logger.log(`org.storageTypes.findById — id: ${id}`);
    return this.nats.send('commerce', 'org.storageTypes.findById', { id });
  }

  // Returns paginated, filtered and sorted storage types for the data table
  async findForTable(userId: string): Promise<StorageTypeTableResponseDto> {
    this.logger.log('org.storageTypes.table');
    const { state, activeViewId } = await this.tableStateService.getTableState(userId, 'commerce-org-storage-types');

    const { result, count } = await this.nats.send<{ result: StorageTypeResponseDto[]; count: number }>(
      'commerce',
      'org.storageTypes.table',
      state,
    );

    return { result, count, state, activeViewId };
  }

  // Deletes a storage type no location or allowed item references
  delete(id: string): Promise<SuccessResponseDto> {
    this.logger.log(`org.storageTypes.delete — id: ${id}`);
    return this.nats.send('commerce', 'org.storageTypes.delete', { id });
  }
}
