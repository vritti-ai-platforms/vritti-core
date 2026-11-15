import type { InventoryItemStorageTypeDto } from '@domain/inventory-item-storage-types/dto/entity/inventory-item-storage-type.dto';
import { CreateInventoryItemStorageTypeDto } from '@domain/inventory-item-storage-types/dto/request/create-inventory-item-storage-type.dto';
import { UpdateInventoryItemStorageTypeDto } from '@domain/inventory-item-storage-types/dto/request/update-inventory-item-storage-type.dto';
import { Controller, Logger } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import type { CreateResponseDto, SuccessResponseDto } from '@vritti/api-sdk/responses';
import { InventoryItemsStorageTypesService } from './services/inventory-items-storage-types.service';

@Controller()
export class InventoryItemsStorageTypesController {
  private readonly logger = new Logger(InventoryItemsStorageTypesController.name);

  constructor(private readonly service: InventoryItemsStorageTypesService) {}

  // Returns the storage types an inventory item may be stored in
  @MessagePattern({ cmd: 'org.inventoryItems.storageTypes.findAll' })
  async findAll(@Payload() data: { inventoryItemId: string }): Promise<InventoryItemStorageTypeDto[]> {
    this.logger.log(`inventoryItems.storageTypes.findAll — inventoryItemId: ${data.inventoryItemId}`);
    return this.service.findAll(data.inventoryItemId);
  }

  // Allows an inventory item in a storage type with its max quantity per location
  @MessagePattern({ cmd: 'org.inventoryItems.storageTypes.create' })
  async create(
    @Payload() dto: CreateInventoryItemStorageTypeDto,
  ): Promise<CreateResponseDto<InventoryItemStorageTypeDto>> {
    this.logger.log(
      `inventoryItems.storageTypes.create — inventoryItemId: ${dto.inventoryItemId}, storageTypeId: ${dto.storageTypeId}`,
    );
    return this.service.create(dto);
  }

  // Updates an inventory item's max quantity per location of a storage type
  @MessagePattern({ cmd: 'org.inventoryItems.storageTypes.update' })
  async update(@Payload() dto: UpdateInventoryItemStorageTypeDto): Promise<SuccessResponseDto> {
    this.logger.log(`inventoryItems.storageTypes.update — inventoryItemId: ${dto.inventoryItemId}, id: ${dto.id}`);
    return this.service.update(dto);
  }

  // Removes a storage type from an inventory item
  @MessagePattern({ cmd: 'org.inventoryItems.storageTypes.delete' })
  async delete(@Payload() data: { inventoryItemId: string; id: string }): Promise<SuccessResponseDto> {
    this.logger.log(`inventoryItems.storageTypes.delete — inventoryItemId: ${data.inventoryItemId}, id: ${data.id}`);
    return this.service.delete(data.inventoryItemId, data.id);
  }
}
