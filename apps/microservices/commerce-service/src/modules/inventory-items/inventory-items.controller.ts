import type { InventoryItemQuantDto, LocationStockDto } from '@domain/inventory-item-quants/dto/entity/inventory-item-quant.dto';
import type { InventoryItemDto } from '@domain/inventory-items/dto/entity/inventory-item.dto';
import { InventoryItemsService } from '@domain/inventory-items/services/inventory-items.service';
import type { InventoryItemLocationDto } from '@domain/inventory-item-locations/dto/entity/inventory-item-location.dto';
import { Controller, Logger } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import type { CreateResponseDto, SelectOptionsQueryDto, SelectQueryResult, SuccessResponseDto, TableViewState } from '@vritti/api-sdk';
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

  // Returns inventory items linked to a specific supplier for select dropdowns
  @MessagePattern({ cmd: 'inventoryItems.selectBySupplier' })
  async selectBySupplier(@Payload() data: SelectOptionsQueryDto & { supplierId: string }): Promise<SelectQueryResult> {
    const { supplierId, ...query } = data;
    this.logger.log(`inventoryItems.selectBySupplier — supplierId: ${supplierId}`);
    return this.service.findForSelectBySupplier(supplierId, query);
  }

  // Returns inventory items scoped to a purchase order for select dropdowns
  @MessagePattern({ cmd: 'inventoryItems.selectByPurchaseOrder' })
  async selectByPurchaseOrder(@Payload() data: SelectOptionsQueryDto & { poId: string }): Promise<SelectQueryResult> {
    const { poId, ...query } = data;
    this.logger.log(`inventoryItems.selectByPurchaseOrder — poId: ${poId}`);
    return this.service.findForSelectByPurchaseOrder(poId, query);
  }

  // Creates a new inventory item
  @MessagePattern({ cmd: 'inventoryItems.create' })
  async create(@Payload() dto: CreateInventoryItemDto): Promise<CreateResponseDto<InventoryItemDto>> {
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
  ): Promise<{ result: InventoryItemQuantDto[]; count: number }> {
    this.logger.log(`inventoryItems.batchesTable — itemId: ${data.itemId}`);
    return this.service.findBatchesForTable(data.itemId, data);
  }

  // Returns location-wise stock aggregates for an inventory item
  @MessagePattern({ cmd: 'inventoryItems.locationStock' })
  async locationStock(@Payload() data: { itemId: string }): Promise<LocationStockDto[]> {
    this.logger.log(`inventoryItems.locationStock — itemId: ${data.itemId}`);
    return this.service.findLocationStock(data.itemId);
  }

  // Returns paginated item-location configs for an inventory item
  @MessagePattern({ cmd: 'inventoryItems.locations.table' })
  async locationsTable(
    @Payload() data: { itemId: string } & TableViewState,
  ): Promise<{ result: InventoryItemLocationDto[]; count: number }> {
    this.logger.log(`inventoryItems.locations.table — itemId: ${data.itemId}`);
    return this.service.findItemLocations(data.itemId, data);
  }

  // Creates an item-location config for an inventory item
  @MessagePattern({ cmd: 'inventoryItems.locations.create' })
  async createLocation(
    @Payload() data: { itemId: string; locationId: string; reorderLevel: number },
  ): Promise<CreateResponseDto<InventoryItemLocationDto>> {
    this.logger.log(`inventoryItems.locations.create — itemId: ${data.itemId}`);
    return this.service.createItemLocation(data.itemId, { locationId: data.locationId, reorderLevel: data.reorderLevel });
  }

  // Updates an item-location config
  @MessagePattern({ cmd: 'inventoryItems.locations.update' })
  async updateLocation(
    @Payload() data: { id: string; reorderLevel: number },
  ): Promise<SuccessResponseDto> {
    this.logger.log(`inventoryItems.locations.update — id: ${data.id}`);
    return this.service.updateItemLocation(data.id, { reorderLevel: data.reorderLevel });
  }

  // Deletes an item-location config
  @MessagePattern({ cmd: 'inventoryItems.locations.delete' })
  async deleteLocation(
    @Payload() data: { id: string },
  ): Promise<SuccessResponseDto> {
    this.logger.log(`inventoryItems.locations.delete — id: ${data.id}`);
    return this.service.deleteItemLocation(data.id);
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
