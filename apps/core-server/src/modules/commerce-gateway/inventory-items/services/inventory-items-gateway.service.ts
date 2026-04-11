import { Injectable, Logger } from '@nestjs/common';
import { type CreateResponseDto, DataTableStateService, NatsClientService, SelectOptionsQueryDto, type SelectQueryResult, type SuccessResponseDto } from '@vritti/api-sdk';
import type { CreateInventoryItemDto } from '../dto/request/create-inventory-item.dto';
import type { UpdateInventoryItemDto } from '../dto/request/update-inventory-item.dto';
import type { InventoryItemResponseDto } from '../dto/response/inventory-item-response.dto';
import type { InventoryItemTableResponseDto } from '../dto/response/inventory-item-table-response.dto';

@Injectable()
export class InventoryItemsGatewayService {
  private readonly logger = new Logger(InventoryItemsGatewayService.name);

  constructor(
    private readonly nats: NatsClientService,
    private readonly dataTableStateService: DataTableStateService,
  ) {}

  // Returns paginated inventory items for the data table
  async findForTable(userId: string): Promise<InventoryItemTableResponseDto> {
    this.logger.log('inventoryItems.table');
    const { state, activeViewId } = await this.dataTableStateService.getCurrentState(userId, 'commerce-inventory-items');
    const { limit = 20, offset = 0 } = state.pagination ?? {};

    const { result, count } = await this.nats.send<{ result: InventoryItemResponseDto[]; count: number }>(
      'commerce',
      'inventoryItems.table',
      {
        filters: state.filters,
        sort: state.sort,
        search: state.search ?? null,
        pagination: { limit, offset },
      },
    );

    return { result, count, state, activeViewId };
  }

  // Returns paginated inventory item options for select dropdowns
  async select(params: SelectOptionsQueryDto): Promise<SelectQueryResult> {
    this.logger.log('inventoryItems.select');
    return this.nats.send('commerce', 'inventoryItems.select', params);
  }

  // Creates a new inventory item
  async create(dto: CreateInventoryItemDto): Promise<CreateResponseDto<InventoryItemResponseDto>> {
    this.logger.log(`inventoryItems.create — name: ${dto.name}, code: ${dto.code}`);
    return this.nats.send('commerce', 'inventoryItems.create', dto);
  }

  // Returns a single inventory item
  async findById(id: string): Promise<InventoryItemResponseDto> {
    this.logger.log(`inventoryItems.findById — id: ${id}`);
    return this.nats.send('commerce', 'inventoryItems.findById', { id });
  }

  // Returns stock levels for an inventory item
  async findLevels(itemId: string) {
    this.logger.log(`inventoryItems.levels — itemId: ${itemId}`);
    return this.nats.send('commerce', 'inventoryItems.levels', { itemId });
  }

  // Returns ledger entries for an inventory item
  async findLedger(itemId: string) {
    this.logger.log(`inventoryItems.ledger — itemId: ${itemId}`);
    return this.nats.send('commerce', 'inventoryItems.ledger', { itemId });
  }

  // Updates an inventory item
  async update(id: string, dto: UpdateInventoryItemDto): Promise<SuccessResponseDto> {
    this.logger.log(`inventoryItems.update — id: ${id}`);
    return this.nats.send('commerce', 'inventoryItems.update', { id, ...dto });
  }

  // Deletes an inventory item
  async delete(id: string): Promise<SuccessResponseDto> {
    this.logger.log(`inventoryItems.delete — id: ${id}`);
    return this.nats.send('commerce', 'inventoryItems.delete', { id });
  }
}
