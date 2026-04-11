import type { InventoryItemDto, InventoryLedgerDto, InventoryLevelDto } from '@domain/inventory-items/dto/entity/inventory-item.dto';
import { InventoryItemsService } from '@domain/inventory-items/services/inventory-items.service';
import { Controller, Logger } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import type { CreateResponseDto, FilterCondition, SearchState, SelectOptionsQueryDto, SelectQueryResult, SortCondition, SuccessResponseDto } from '@vritti/api-sdk';
import type { CreateInventoryItemDto } from './dto/request/create-inventory-item.dto';
import type { UpdateInventoryItemDto } from './dto/request/update-inventory-item.dto';

@Controller()
export class InventoryItemsController {
  private readonly logger = new Logger(InventoryItemsController.name);

  constructor(private readonly service: InventoryItemsService) {}

  // Returns paginated inventory items for the data table
  @MessagePattern({ cmd: 'inventoryItems.table' })
  async table(@Payload() data: {
    filters: FilterCondition[];
    sort: SortCondition[];
    search: SearchState | null;
    pagination: { limit: number; offset: number };
  }): Promise<{ result: InventoryItemDto[]; count: number }> {
    this.logger.log('inventoryItems.table');
    return this.service.findForTable({
      filters: data.filters ?? [],
      sort: data.sort ?? [],
      search: data.search ?? null,
      pagination: data.pagination ?? { limit: 20, offset: 0 },
    });
  }

  // Returns paginated inventory item options for select dropdowns
  @MessagePattern({ cmd: 'inventoryItems.select' })
  async select(@Payload() data: SelectOptionsQueryDto): Promise<SelectQueryResult> {
    this.logger.log('inventoryItems.select');
    return this.service.findForSelect(data);
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

  // Returns stock levels for an inventory item
  @MessagePattern({ cmd: 'inventoryItems.levels' })
  async levels(@Payload() data: { itemId: string }): Promise<InventoryLevelDto[]> {
    this.logger.log(`inventoryItems.levels — itemId: ${data.itemId}`);
    return this.service.findLevels(data.itemId);
  }

  // Returns ledger entries for an inventory item
  @MessagePattern({ cmd: 'inventoryItems.ledger' })
  async ledger(@Payload() data: { itemId: string }): Promise<InventoryLedgerDto[]> {
    this.logger.log(`inventoryItems.ledger — itemId: ${data.itemId}`);
    return this.service.findLedger(data.itemId);
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
