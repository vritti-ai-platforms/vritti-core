import { Injectable, Logger } from '@nestjs/common';
import { DataTableStateService } from '@vritti/api-sdk/data-table';
import type {
  CreateResponseDto,
  FilterCondition,
  SearchState,
  SortCondition,
  SuccessResponseDto,
} from '@vritti/api-sdk/database';
import { NatsClientService } from '@vritti/api-sdk/nats';
import type { CreateInventoryItemDto } from '../dto/request/create-inventory-item.dto';
import type { CreateInventoryItemUomConversionDto } from '../dto/request/create-inventory-item-uom-conversion.dto';
import type { UpdateInventoryItemDto } from '../dto/request/update-inventory-item.dto';
import type { UpdateInventoryItemUomConversionDto } from '../dto/request/update-inventory-item-uom-conversion.dto';
import type { InventoryItemLedgerResponseDto } from '../dto/response/inventory-item-ledger-response.dto';
import type { InventoryItemLedgerTableResponseDto } from '../dto/response/inventory-item-ledger-table-response.dto';
import type { InventoryItemLocationResponseDto } from '../dto/response/inventory-item-location-response.dto';
import type { InventoryItemLocationTableResponseDto } from '../dto/response/inventory-item-location-table-response.dto';
import type { InventoryItemLotResponseDto } from '../dto/response/inventory-item-lot-response.dto';
import type { InventoryItemLotTableResponseDto } from '../dto/response/inventory-item-lot-table-response.dto';
import type { InventoryItemQuantResponseDto } from '../dto/response/inventory-item-quant-response.dto';
import type { InventoryItemQuantTableResponseDto } from '../dto/response/inventory-item-quant-table-response.dto';
import type { InventoryItemResponseDto } from '../dto/response/inventory-item-response.dto';
import type { InventoryItemStockResponseDto } from '../dto/response/inventory-item-stock-response.dto';
import type {
  InventoryItemSupplierResponseDto,
  InventoryItemSupplierTableResponseDto,
} from '../dto/response/inventory-item-supplier-response.dto';
import type { InventoryItemTableResponseDto } from '../dto/response/inventory-item-table-response.dto';
import type { InventoryItemUomConversionResponseDto } from '../dto/response/inventory-item-uom-conversion-response.dto';

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
    const { state, activeViewId } = await this.dataTableStateService.getCurrentState(
      userId,
      'commerce-inventory-items',
    );

    const { result, count } = await this.nats.send<{ result: InventoryItemResponseDto[]; count: number }>(
      'commerce',
      'inventoryItems.table',
      state,
    );

    return { result, count, state, activeViewId };
  }

  // Keyset/cursor Relay connection for the mobile infinite feed (GraphQL-only — no REST route).
  async findForFeed(query: {
    filters?: FilterCondition[];
    search?: SearchState | null;
    sort?: SortCondition[];
    limit?: number;
    cursor?: string;
  }): Promise<{
    edges: { cursor: string; node: InventoryItemResponseDto }[];
    pageInfo: { hasNextPage: boolean; endCursor: string | null };
  }> {
    this.logger.log('inventoryItems.feed');
    return this.nats.send('commerce', 'inventoryItems.feed', query);
  }

  // Creates a new inventory item
  async create(dto: CreateInventoryItemDto): Promise<CreateResponseDto<InventoryItemResponseDto>> {
    this.logger.log(`inventoryItems.create — name: ${dto.name}, code: ${dto.code}`);
    return this.nats.send('commerce', 'inventoryItems.create', dto);
  }

  // Returns supplier links for a given inventory item, table-shaped
  async findSuppliersTable(inventoryItemId: string, userId: string): Promise<InventoryItemSupplierTableResponseDto> {
    this.logger.log(`inventoryItems.suppliersTable — inventoryItemId: ${inventoryItemId}`);
    const { state, activeViewId } = await this.dataTableStateService.getCurrentState(
      userId,
      `commerce-inventory-item-${inventoryItemId}-suppliers`,
    );

    const { result, count } = await this.nats.send<{ result: InventoryItemSupplierResponseDto[]; count: number }>(
      'commerce',
      'inventoryItems.suppliersTable',
      { inventoryItemId: inventoryItemId, ...state },
    );

    return { result, count, state, activeViewId };
  }

  // Returns a single inventory item
  async findById(id: string): Promise<InventoryItemResponseDto> {
    this.logger.log(`inventoryItems.findById — id: ${id}`);
    return this.nats.send('commerce', 'inventoryItems.findById', { id });
  }

  // Returns paginated ledger entries for an inventory item data table
  async findLedgerForTable(inventoryItemId: string, userId: string): Promise<InventoryItemLedgerTableResponseDto> {
    this.logger.log('inventoryItems.ledgerTable');
    const { state, activeViewId } = await this.dataTableStateService.getCurrentState(
      userId,
      `inventory-item-${inventoryItemId}-ledger`,
    );

    const { result, count } = await this.nats.send<{ result: InventoryItemLedgerResponseDto[]; count: number }>(
      'commerce',
      'inventoryItems.ledgerTable',
      { inventoryItemId, ...state },
    );

    return { result, count, state, activeViewId };
  }

  // Returns location-wise stock aggregates for an inventory item, sourced from inventory_item_quants.
  async findStocks(inventoryItemId: string): Promise<InventoryItemStockResponseDto[]> {
    this.logger.log(`inventoryItems.stocks — inventoryItemId: ${inventoryItemId}`);
    return this.nats.send('commerce', 'inventoryItems.stocks', { inventoryItemId });
  }

  // Returns paginated quants for an inventory item data table
  async findQuantsForTable(inventoryItemId: string, userId: string): Promise<InventoryItemQuantTableResponseDto> {
    this.logger.log('inventoryItems.quantsTable');
    const { state, activeViewId } = await this.dataTableStateService.getCurrentState(
      userId,
      `inventory-item-${inventoryItemId}-quants`,
    );

    const { result, count } = await this.nats.send<{
      result: InventoryItemQuantResponseDto[];
      count: number;
    }>('commerce', 'inventoryItems.quantsTable', { inventoryItemId, ...state });

    return { result, count, state, activeViewId };
  }

  // Returns paginated lots for an inventory item data table
  async findLotsForTable(inventoryItemId: string, userId: string): Promise<InventoryItemLotTableResponseDto> {
    this.logger.log('inventoryItems.lotsTable');
    const { state, activeViewId } = await this.dataTableStateService.getCurrentState(
      userId,
      `inventory-item-${inventoryItemId}-lots`,
    );

    const { result, count } = await this.nats.send<{
      result: InventoryItemLotResponseDto[];
      count: number;
    }>('commerce', 'inventoryItems.lotsTable', { inventoryItemId, ...state });

    return { result, count, state, activeViewId };
  }

  // Returns paginated item-location configs for an inventory item
  async findItemLocationsForTable(
    inventoryItemId: string,
    userId: string,
  ): Promise<InventoryItemLocationTableResponseDto> {
    this.logger.log('inventoryItems.locationsTable');
    const { state, activeViewId } = await this.dataTableStateService.getCurrentState(
      userId,
      `inventory-item-${inventoryItemId}-locations`,
    );

    const { result, count } = await this.nats.send<{
      result: InventoryItemLocationResponseDto[];
      count: number;
    }>('commerce', 'inventoryItems.locationsTable', { inventoryItemId, ...state });

    return { result, count, state, activeViewId };
  }

  // Creates an item-location config for an inventory item
  async createItemLocation(inventoryItemId: string, dto: { locationId: string; reorderLevel: number }) {
    this.logger.log(`inventoryItems.addLocation — inventoryItemId: ${inventoryItemId}`);
    return this.nats.send('commerce', 'inventoryItems.addLocation', { inventoryItemId, ...dto });
  }

  // Updates an item-location config
  async updateItemLocation(id: string, dto: { reorderLevel: number }) {
    this.logger.log(`inventoryItems.updateLocation — id: ${id}`);
    return this.nats.send('commerce', 'inventoryItems.updateLocation', { id, ...dto });
  }

  // Deletes an item-location config
  async deleteItemLocation(id: string) {
    this.logger.log(`inventoryItems.removeLocation — id: ${id}`);
    return this.nats.send('commerce', 'inventoryItems.removeLocation', { id });
  }

  // Returns paginated UOM conversion overrides for an inventory item
  async findUomConversionsForTable(inventoryItemId: string, userId: string) {
    this.logger.log(`inventoryItems.uomConversionsTable — inventoryItemId: ${inventoryItemId}`);
    const { state, activeViewId } = await this.dataTableStateService.getCurrentState(
      userId,
      `inventory-item-${inventoryItemId}-uom-overrides`,
    );

    const { result, count } = await this.nats.send<{ result: InventoryItemUomConversionResponseDto[]; count: number }>(
      'commerce',
      'inventoryItems.uomConversionsTable',
      { inventoryItemId, ...state },
    );

    return { result, count, state, activeViewId };
  }

  // Creates a per-item UOM conversion override
  async createUomConversion(
    inventoryItemId: string,
    dto: CreateInventoryItemUomConversionDto,
  ): Promise<CreateResponseDto<InventoryItemUomConversionResponseDto>> {
    this.logger.log(`inventoryItems.addUomConversion — inventoryItemId: ${inventoryItemId}`);
    return this.nats.send('commerce', 'inventoryItems.addUomConversion', { inventoryItemId, ...dto });
  }

  // Updates a per-item UOM conversion override
  async updateUomConversion(
    conversionId: string,
    dto: UpdateInventoryItemUomConversionDto,
  ): Promise<SuccessResponseDto> {
    this.logger.log(`inventoryItems.updateUomConversion — id: ${conversionId}`);
    return this.nats.send('commerce', 'inventoryItems.updateUomConversion', { id: conversionId, ...dto });
  }

  // Deletes a per-item UOM conversion override
  async deleteUomConversion(conversionId: string): Promise<SuccessResponseDto> {
    this.logger.log(`inventoryItems.removeUomConversion — id: ${conversionId}`);
    return this.nats.send('commerce', 'inventoryItems.removeUomConversion', { id: conversionId });
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
