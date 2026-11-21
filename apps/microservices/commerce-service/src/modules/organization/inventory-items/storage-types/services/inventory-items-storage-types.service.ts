import type { InventoryItemStorageTypeDto } from '@domain/inventory-item-storage-types/dto/entity/inventory-item-storage-type.dto';
import type { CreateInventoryItemStorageTypeDto } from '@domain/inventory-item-storage-types/dto/request/create-inventory-item-storage-type.dto';
import type { UpdateInventoryItemStorageTypeDto } from '@domain/inventory-item-storage-types/dto/request/update-inventory-item-storage-type.dto';
import { InventoryItemStorageTypesDomainService } from '@domain/inventory-item-storage-types/services/inventory-item-storage-types.service';
import { InventoryItemsDomainService } from '@domain/inventory-items/services/inventory-items.service';
import { StorageTypesDomainService } from '@domain/storage-types/services/storage-types.service';
import { Injectable, Logger } from '@nestjs/common';
import type { CreateResponseDto, SuccessResponseDto } from '@vritti/api-sdk/responses';

// Top-level service for an item's allowed storage types: the item and its convertible units come from the
// inventory-items domain and the storage type must be assignable in the storage-types domain.
@Injectable()
export class InventoryItemsStorageTypesService {
  private readonly logger = new Logger(InventoryItemsStorageTypesService.name);

  constructor(
    private readonly inventoryItemsService: InventoryItemsDomainService,
    private readonly storageTypesService: StorageTypesDomainService,
    private readonly itemStorageTypesService: InventoryItemStorageTypesDomainService,
  ) {}

  // Allows the item in a storage type
  async create(dto: CreateInventoryItemStorageTypeDto): Promise<CreateResponseDto<{ id: string }>> {
    const { inventoryItemId, ...data } = dto;
    this.logger.log(`create — inventoryItemId=${inventoryItemId}, storageTypeId=${data.storageTypeId}`);
    const { allowedUomIds } = await this.inventoryItemsService.findAllowedUomIds(inventoryItemId);
    await this.storageTypesService.requireAssignable(data.storageTypeId, 'storageTypeId');
    return this.itemStorageTypesService.create({ inventoryItemId, allowedUomIds }, data);
  }

  // Changes the item's max quantity per location of a storage type, or its unit
  async update(dto: UpdateInventoryItemStorageTypeDto): Promise<SuccessResponseDto> {
    const { inventoryItemId, id, ...data } = dto;
    this.logger.log(`update — inventoryItemId=${inventoryItemId}, id=${id}`);
    const { allowedUomIds } = await this.inventoryItemsService.findAllowedUomIds(inventoryItemId);
    return this.itemStorageTypesService.update({ inventoryItemId, allowedUomIds }, id, data);
  }

  // Returns the storage types the item may be stored in
  async findAll(inventoryItemId: string): Promise<InventoryItemStorageTypeDto[]> {
    await this.inventoryItemsService.findById(inventoryItemId);
    return this.itemStorageTypesService.findAll(inventoryItemId);
  }

  // Removes a storage type from the item
  delete(inventoryItemId: string, id: string): Promise<SuccessResponseDto> {
    this.logger.log(`delete — inventoryItemId=${inventoryItemId}, id=${id}`);
    return this.itemStorageTypesService.delete(inventoryItemId, id);
  }
}
