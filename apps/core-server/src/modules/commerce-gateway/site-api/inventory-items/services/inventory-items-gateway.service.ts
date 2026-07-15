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
import type { EnableInventoryItemDto } from '../dto/request/enable-inventory-item.dto';
import type { UpdateInventoryItemDto } from '../dto/request/update-inventory-item.dto';
import type { UpdateInventoryItemUomConversionDto } from '../dto/request/update-inventory-item-uom-conversion.dto';
import type { UpdateReorderDto } from '../dto/request/update-reorder.dto';
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
    this.logger.log('site.inventoryItems.table');
    const { state, activeViewId } = await this.dataTableStateService.getCurrentState(
      userId,
      'commerce-inventory-items',
    );

    const { result, count } = await this.nats.send<{ result: InventoryItemResponseDto[]; count: number }>(
      'commerce',
      'site.inventoryItems.table',
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
    return this.nats.send('commerce', 'site.inventoryItems.feed', query);
  }

  // Creates a new inventory item
  async create(dto: CreateInventoryItemDto): Promise<CreateResponseDto<InventoryItemResponseDto>> {
    this.logger.log(`org.inventoryItems.create — name: ${dto.name}, code: ${dto.code}`);
    return this.nats.send('commerce', 'org.inventoryItems.create', dto);
  }

  // Enables a master inventory item at the current site
  async enable(dto: EnableInventoryItemDto): Promise<CreateResponseDto<{ id: string }>> {
    this.logger.log(`site.inventoryItems.enable — inventoryItemId: ${dto.inventoryItemId}`);
    return this.nats.send('commerce', 'site.inventoryItems.enable', dto);
  }

  // Updates the reorder point for an item at the current site
  async updateReorder(dto: UpdateReorderDto): Promise<SuccessResponseDto> {
    this.logger.log(`site.inventoryItems.reorder.update — inventoryItemId: ${dto.inventoryItemId}`);
    return this.nats.send('commerce', 'site.inventoryItems.reorder.update', dto);
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
      'site.inventoryItems.suppliersTable',
      { inventoryItemId: inventoryItemId, ...state },
    );

    return { result, count, state, activeViewId };
  }

  // Keyset Relay connection of an item's supplier links for the mobile infinite feed (mirrors
  // findStockLevelsForFeed). Read-only; each row already has a unique id, so the node is forwarded as-is.
  async findSuppliersForFeed(query: { inventoryItemId: string; first?: number; after?: string }): Promise<{
    edges: { cursor: string; node: InventoryItemSupplierResponseDto }[];
    pageInfo: { hasNextPage: boolean; endCursor: string | null };
  }> {
    this.logger.log(`inventoryItems.suppliersFeed — inventoryItemId: ${query.inventoryItemId}`);
    return this.nats.send<{
      edges: { cursor: string; node: InventoryItemSupplierResponseDto }[];
      pageInfo: { hasNextPage: boolean; endCursor: string | null };
    }>('commerce', 'site.inventoryItems.suppliersFeed', {
      inventoryItemId: query.inventoryItemId,
      limit: query.first ?? 20,
      cursor: query.after,
    });
  }

  // Returns a single inventory item
  async findById(id: string): Promise<InventoryItemResponseDto> {
    this.logger.log(`inventoryItems.findById — id: ${id}`);
    return this.nats.send('commerce', 'site.inventoryItems.findById', { id });
  }

  // Returns paginated ledger entries for an inventory item data table
  async findLedgerForTable(inventoryItemId: string, userId: string): Promise<InventoryItemLedgerTableResponseDto> {
    this.logger.log('site.inventoryItems.ledgerTable');
    const { state, activeViewId } = await this.dataTableStateService.getCurrentState(
      userId,
      `inventory-item-${inventoryItemId}-ledger`,
    );

    const { result, count } = await this.nats.send<{ result: InventoryItemLedgerResponseDto[]; count: number }>(
      'commerce',
      'site.inventoryItems.ledgerTable',
      { inventoryItemId, ...state },
    );

    return { result, count, state, activeViewId };
  }

  // Keyset Relay connection of an item's ledger entries for the mobile infinite feed (mirrors
  // findStockLevelsForFeed). Read-only; each row already has a unique id, so the node is forwarded as-is.
  async findLedgerForFeed(query: { inventoryItemId: string; first?: number; after?: string }): Promise<{
    edges: { cursor: string; node: InventoryItemLedgerResponseDto }[];
    pageInfo: { hasNextPage: boolean; endCursor: string | null };
  }> {
    this.logger.log(`inventoryItems.ledgerFeed — inventoryItemId: ${query.inventoryItemId}`);
    return this.nats.send<{
      edges: { cursor: string; node: InventoryItemLedgerResponseDto }[];
      pageInfo: { hasNextPage: boolean; endCursor: string | null };
    }>('commerce', 'site.inventoryItems.ledgerFeed', {
      inventoryItemId: query.inventoryItemId,
      limit: query.first ?? 20,
      cursor: query.after,
    });
  }

  // Returns location-wise stock aggregates for an inventory item, sourced from inventory_item_quants.
  async findStocks(inventoryItemId: string): Promise<InventoryItemStockResponseDto[]> {
    this.logger.log(`inventoryItems.stocks — inventoryItemId: ${inventoryItemId}`);
    return this.nats.send('commerce', 'site.inventoryItems.stocks', { inventoryItemId });
  }

  // Keyset Relay connection of per-location stock levels for the mobile infinite feed (a single item can be
  // stocked in >100 locations). The commerce-service keyset-paginates at the DB and builds the opaque cursor
  // + composite `id` (item:location); this is a thin forward. The client merges pages via relayStylePagination.
  async findStockLevelsForFeed(query: { inventoryItemId: string; first?: number; after?: string }): Promise<{
    edges: { cursor: string; node: InventoryItemStockResponseDto & { id: string } }[];
    pageInfo: { hasNextPage: boolean; endCursor: string | null };
  }> {
    this.logger.log(`inventoryItems.stocksFeed — inventoryItemId: ${query.inventoryItemId}`);
    return this.nats.send<{
      edges: { cursor: string; node: InventoryItemStockResponseDto & { id: string } }[];
      pageInfo: { hasNextPage: boolean; endCursor: string | null };
    }>('commerce', 'site.inventoryItems.stocksFeed', {
      inventoryItemId: query.inventoryItemId,
      limit: query.first ?? 20,
      cursor: query.after,
    });
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
    }>('commerce', 'site.inventoryItems.quantsTable', { inventoryItemId, ...state });

    return { result, count, state, activeViewId };
  }

  // Keyset Relay connection of an item's quants for the mobile infinite feed (mirrors
  // findStockLevelsForFeed). Read-only; each row already has a unique id, so the node is forwarded as-is.
  async findQuantsForFeed(query: { inventoryItemId: string; first?: number; after?: string }): Promise<{
    edges: { cursor: string; node: InventoryItemQuantResponseDto }[];
    pageInfo: { hasNextPage: boolean; endCursor: string | null };
  }> {
    this.logger.log(`inventoryItems.quantsFeed — inventoryItemId: ${query.inventoryItemId}`);
    return this.nats.send<{
      edges: { cursor: string; node: InventoryItemQuantResponseDto }[];
      pageInfo: { hasNextPage: boolean; endCursor: string | null };
    }>('commerce', 'site.inventoryItems.quantsFeed', {
      inventoryItemId: query.inventoryItemId,
      limit: query.first ?? 20,
      cursor: query.after,
    });
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
    }>('commerce', 'site.inventoryItems.lotsTable', { inventoryItemId, ...state });

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
    }>('commerce', 'site.inventoryItems.locationsTable', { inventoryItemId, ...state });

    return { result, count, state, activeViewId };
  }

  // Keyset Relay connection of an item's location configs for the mobile infinite feed (mirrors
  // findStockLevelsForFeed). Each row already has a unique id, so the node is forwarded as-is.
  async findItemLocationsForFeed(query: { inventoryItemId: string; first?: number; after?: string }): Promise<{
    edges: { cursor: string; node: InventoryItemLocationResponseDto }[];
    pageInfo: { hasNextPage: boolean; endCursor: string | null };
  }> {
    this.logger.log(`inventoryItems.locationsFeed — inventoryItemId: ${query.inventoryItemId}`);
    return this.nats.send<{
      edges: { cursor: string; node: InventoryItemLocationResponseDto }[];
      pageInfo: { hasNextPage: boolean; endCursor: string | null };
    }>('commerce', 'site.inventoryItems.locationsFeed', {
      inventoryItemId: query.inventoryItemId,
      limit: query.first ?? 20,
      cursor: query.after,
    });
  }

  // Creates an item-location config; returns the created entity so the client inserts it into the cached feed.
  async createItemLocation(
    inventoryItemId: string,
    dto: { locationId: string; reorderLevel: number },
  ): Promise<CreateResponseDto<InventoryItemLocationResponseDto>> {
    this.logger.log(`inventoryItems.addLocation — inventoryItemId: ${inventoryItemId}`);
    return this.nats.send('commerce', 'site.inventoryItems.addLocation', { inventoryItemId, ...dto });
  }

  // Updates an item-location config
  async updateItemLocation(id: string, dto: { reorderLevel: number }): Promise<SuccessResponseDto> {
    this.logger.log(`inventoryItems.updateLocation — id: ${id}`);
    return this.nats.send('commerce', 'site.inventoryItems.updateLocation', { id, ...dto });
  }

  // Deletes an item-location config
  async deleteItemLocation(id: string): Promise<SuccessResponseDto> {
    this.logger.log(`inventoryItems.removeLocation — id: ${id}`);
    return this.nats.send('commerce', 'site.inventoryItems.removeLocation', { id });
  }

  // Returns paginated UOM conversion overrides for an inventory item
  async findUomConversionsForTable(inventoryItemId: string, userId: string) {
    this.logger.log(`org.inventoryItems.uom.table — inventoryItemId: ${inventoryItemId}`);
    const { state, activeViewId } = await this.dataTableStateService.getCurrentState(
      userId,
      `inventory-item-${inventoryItemId}-uom-overrides`,
    );

    const { result, count } = await this.nats.send<{ result: InventoryItemUomConversionResponseDto[]; count: number }>(
      'commerce',
      'org.inventoryItems.uom.table',
      { inventoryItemId, ...state },
    );

    return { result, count, state, activeViewId };
  }

  // Lean list of an item's UOM conversion overrides for the mobile detail tab — skips the web DataTableState
  // machinery (no per-user saved views). The per-item list is small/bounded, so request a single large page.
  // The commerce-service handler reads state.pagination/filters/search/sort, so pass an explicit default state
  // (pagination is required — it destructures state.pagination.limit).
  async findUomConversions(inventoryItemId: string): Promise<InventoryItemUomConversionResponseDto[]> {
    this.logger.log(`org.inventoryItems.uom.table (list) — inventoryItemId: ${inventoryItemId}`);
    const { result } = await this.nats.send<{ result: InventoryItemUomConversionResponseDto[]; count: number }>(
      'commerce',
      'org.inventoryItems.uom.table',
      { inventoryItemId, filters: [], search: null, sort: [], pagination: { limit: 100, offset: 0 } },
    );
    return result;
  }

  // Creates a per-item UOM conversion override
  async createUomConversion(
    inventoryItemId: string,
    dto: CreateInventoryItemUomConversionDto,
  ): Promise<CreateResponseDto<InventoryItemUomConversionResponseDto>> {
    this.logger.log(`org.inventoryItems.uom.create — inventoryItemId: ${inventoryItemId}`);
    return this.nats.send('commerce', 'org.inventoryItems.uom.create', { inventoryItemId, ...dto });
  }

  // Updates a per-item UOM conversion override
  async updateUomConversion(
    conversionId: string,
    dto: UpdateInventoryItemUomConversionDto,
  ): Promise<SuccessResponseDto> {
    this.logger.log(`org.inventoryItems.uom.update — id: ${conversionId}`);
    return this.nats.send('commerce', 'org.inventoryItems.uom.update', { id: conversionId, ...dto });
  }

  // Deletes a per-item UOM conversion override
  async deleteUomConversion(conversionId: string): Promise<SuccessResponseDto> {
    this.logger.log(`org.inventoryItems.uom.delete — id: ${conversionId}`);
    return this.nats.send('commerce', 'org.inventoryItems.uom.delete', { id: conversionId });
  }

  // Updates an inventory item
  async update(id: string, dto: UpdateInventoryItemDto): Promise<SuccessResponseDto> {
    this.logger.log(`org.inventoryItems.update — id: ${id}`);
    return this.nats.send('commerce', 'org.inventoryItems.update', { id, ...dto });
  }

  // Deletes an inventory item
  async delete(id: string): Promise<SuccessResponseDto> {
    this.logger.log(`org.inventoryItems.delete — id: ${id}`);
    return this.nats.send('commerce', 'org.inventoryItems.delete', { id });
  }
}
