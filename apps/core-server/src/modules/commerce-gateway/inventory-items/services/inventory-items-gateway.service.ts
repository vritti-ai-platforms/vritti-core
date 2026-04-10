import { Injectable, Logger } from '@nestjs/common';
import { DataTableStateService, NatsClientService, SelectOptionsQueryDto, type SelectQueryResult } from '@vritti/api-sdk';
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
  async create(dto: CreateInventoryItemDto): Promise<InventoryItemResponseDto> {
    this.logger.log(`inventoryItems.create — name: ${dto.name}`);
    return this.nats.send('commerce', 'inventoryItems.create', dto);
  }

  // Returns inventory item detail with levels and ledger
  async findById(id: string): Promise<unknown> {
    this.logger.log(`inventoryItems.findById — id: ${id}`);
    return this.nats.send('commerce', 'inventoryItems.findById', { id });
  }

  // Updates an inventory item
  async update(id: string, dto: UpdateInventoryItemDto): Promise<InventoryItemResponseDto> {
    this.logger.log(`inventoryItems.update — id: ${id}`);
    return this.nats.send('commerce', 'inventoryItems.update', { id, ...dto });
  }

  // Deletes an inventory item
  async delete(id: string): Promise<{ success: boolean; message: string }> {
    this.logger.log(`inventoryItems.delete — id: ${id}`);
    return this.nats.send('commerce', 'inventoryItems.delete', { id });
  }
}
