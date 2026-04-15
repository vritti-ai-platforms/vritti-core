import type { InventoryItemBatchDto, LocationStockDto } from '@domain/inventory-item-batches/dto/entity/inventory-item-batch.dto';
import type { InventoryItemDto } from '@domain/inventory-items/dto/entity/inventory-item.dto';
import { InventoryItemsService } from '@domain/inventory-items/services/inventory-items.service';
import type { StorageLocationConfigDto } from '@domain/storage-location-configs/dto/entity/storage-location-config.dto';
import { Controller, Logger } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import type { SelectOptionsQueryDto, SelectQueryResult, SuccessResponseDto, TableViewState } from '@vritti/api-sdk';
import type { CreateInventoryItemDto } from './dto/request/create-inventory-item.dto';
import type { UpdateInventoryItemDto } from './dto/request/update-inventory-item.dto';

@Controller()
export class InventoryItemsController {
  private readonly logger = new Logger(InventoryItemsController.name);

  constructor(private readonly service: InventoryItemsService) {}

  // Returns paginated inventory items for the data table
  @MessagePattern({ cmd: 'inventoryItems.table' })
  async table(
    @Payload() state: TableViewState,
  ): Promise<{ result: InventoryItemDto[]; count: number }> {
    this.logger.log('inventoryItems.table');
    return this.service.findForTable(state);
  }

  // Returns paginated inventory item options for select dropdowns
  @MessagePattern({ cmd: 'inventoryItems.select' })
  async select(@Payload() data: SelectOptionsQueryDto): Promise<SelectQueryResult> {
    this.logger.log('inventoryItems.select');
    return this.service.findForSelect(data);
  }

  // Creates a new inventory item
  @MessagePattern({ cmd: 'inventoryItems.create' })
  async create(@Payload() dto: CreateInventoryItemDto): Promise<InventoryItemDto> {
    this.logger.log(`inventoryItems.create — name: ${dto.name}, code: ${dto.code}`);
    return this.service.create(dto);
  }

  // Returns a single inventory item
  @MessagePattern({ cmd: 'inventoryItems.findById' })
  async findById(@Payload() data: { id: string }): Promise<InventoryItemDto> {
    this.logger.log(`inventoryItems.findById — id: ${data.id}`);
    return this.service.findById(data.id);
  }

  // Returns paginated inventory batches for an inventory item
  @MessagePattern({ cmd: 'inventoryItems.batchesTable' })
  async batchesTable(
    @Payload() data: { itemId: string } & TableViewState,
  ): Promise<{ result: InventoryItemBatchDto[]; count: number }> {
    this.logger.log(`inventoryItems.batchesTable — itemId: ${data.itemId}`);
    return this.service.findBatchesForTable(data.itemId, data);
  }

  // Returns location-wise stock aggregates for an inventory item
  @MessagePattern({ cmd: 'inventoryItems.locationStock' })
  async locationStock(@Payload() data: { itemId: string }): Promise<LocationStockDto[]> {
    this.logger.log(`inventoryItems.locationStock — itemId: ${data.itemId}`);
    return this.service.findLocationStock(data.itemId);
  }

  // Returns paginated storage location configs for an inventory item
  @MessagePattern({ cmd: 'inventoryItems.storageLocationConfigs.table' })
  async storageLocationConfigsTable(
    @Payload() data: { itemId: string } & TableViewState,
  ): Promise<{ result: StorageLocationConfigDto[]; count: number }> {
    this.logger.log(`inventoryItems.storageLocationConfigs.table — itemId: ${data.itemId}`);
    return this.service.findStorageLocationConfigs(data.itemId, data);
  }

  // Creates a storage location config for an inventory item
  @MessagePattern({ cmd: 'inventoryItems.storageLocationConfigs.create' })
  async createStorageLocationConfig(
    @Payload() data: { itemId: string; locationId: string; reorderLevel: number },
  ): Promise<StorageLocationConfigDto> {
    this.logger.log(`inventoryItems.storageLocationConfigs.create — itemId: ${data.itemId}`);
    return this.service.createStorageLocationConfig(data.itemId, { locationId: data.locationId, reorderLevel: data.reorderLevel });
  }

  // Updates a storage location config
  @MessagePattern({ cmd: 'inventoryItems.storageLocationConfigs.update' })
  async updateStorageLocationConfig(
    @Payload() data: { id: string; reorderLevel: number },
  ): Promise<SuccessResponseDto> {
    this.logger.log(`inventoryItems.storageLocationConfigs.update — id: ${data.id}`);
    return this.service.updateStorageLocationConfig(data.id, { reorderLevel: data.reorderLevel });
  }

  // Deletes a storage location config
  @MessagePattern({ cmd: 'inventoryItems.storageLocationConfigs.delete' })
  async deleteStorageLocationConfig(
    @Payload() data: { id: string },
  ): Promise<SuccessResponseDto> {
    this.logger.log(`inventoryItems.storageLocationConfigs.delete — id: ${data.id}`);
    return this.service.deleteStorageLocationConfig(data.id);
  }

  // Updates an inventory item
  @MessagePattern({ cmd: 'inventoryItems.update' })
  async update(@Payload() data: { id: string } & UpdateInventoryItemDto): Promise<SuccessResponseDto> {
    const { id, ...updateData } = data;
    this.logger.log(`inventoryItems.update — id: ${id}`);
    return this.service.update(id, updateData);
  }

  // Deletes an inventory item
  @MessagePattern({ cmd: 'inventoryItems.delete' })
  async delete(@Payload() data: { id: string }): Promise<SuccessResponseDto> {
    this.logger.log(`inventoryItems.delete — id: ${data.id}`);
    return this.service.delete(data.id);
  }
}
