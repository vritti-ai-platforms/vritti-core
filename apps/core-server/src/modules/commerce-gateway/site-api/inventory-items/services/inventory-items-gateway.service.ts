import type { CreateSiteInventoryItemDto } from '@commerce/inventory-item-sites/dto/request/create-inventory-item.dto';
import type { CreateInventoryItemLocationDto } from '@commerce/inventory-item-sites/dto/request/create-inventory-item-location.dto';
import type { UpdateSiteInventoryItemDto } from '@commerce/inventory-item-sites/dto/request/update-inventory-item.dto';
import type { UpdateInventoryItemLocationDto } from '@commerce/inventory-item-sites/dto/request/update-inventory-item-location.dto';
import type { InventoryItemLedgerResponseDto } from '@commerce/inventory-item-sites/dto/response/inventory-item-ledger-response.dto';
import type { InventoryItemLedgerTableResponseDto } from '@commerce/inventory-item-sites/dto/response/inventory-item-ledger-table-response.dto';
import type { InventoryItemLocationResponseDto } from '@commerce/inventory-item-sites/dto/response/inventory-item-location-response.dto';
import type { InventoryItemLocationTableResponseDto } from '@commerce/inventory-item-sites/dto/response/inventory-item-location-table-response.dto';
import type { InventoryItemLotResponseDto } from '@commerce/inventory-item-sites/dto/response/inventory-item-lot-response.dto';
import type { InventoryItemLotTableResponseDto } from '@commerce/inventory-item-sites/dto/response/inventory-item-lot-table-response.dto';
import type { InventoryItemQuantResponseDto } from '@commerce/inventory-item-sites/dto/response/inventory-item-quant-response.dto';
import type { InventoryItemQuantTableResponseDto } from '@commerce/inventory-item-sites/dto/response/inventory-item-quant-table-response.dto';
import type { SiteInventoryItemResponseDto } from '@commerce/inventory-item-sites/dto/response/inventory-item-response.dto';
import type { InventoryItemStockResponseDto } from '@commerce/inventory-item-sites/dto/response/inventory-item-stock-response.dto';
import type { SiteInventoryItemUomConversionResponseDto } from '@commerce/inventory-item-sites/dto/response/inventory-item-uom-conversion-response.dto';
import type {
  SiteStockTableResponseDto,
  SiteStockTableRowDto,
} from '@commerce/inventory-item-sites/dto/response/site-stock-table-response.dto';
import type { CreateInventoryItemUomConversionDto } from '@commerce/inventory-items/dto/request/create-inventory-item-uom-conversion.dto';
import type { CreateSiteStockLevelsDto } from '@commerce/inventory-items/dto/request/create-site-stock-levels.dto';
import type { UpdateInventoryItemUomConversionDto } from '@commerce/inventory-items/dto/request/update-inventory-item-uom-conversion.dto';
import type { UpdateSiteStockLevelsDto } from '@commerce/inventory-items/dto/request/update-site-stock-levels.dto';
import type { InventoryItemSiteStockLevelResponseDto } from '@commerce/inventory-items/dto/response/inventory-item-site-stock-level-response.dto';
import type {
  InventoryItemSupplierResponseDto,
  InventoryItemSupplierTableResponseDto,
} from '@commerce/inventory-items/dto/response/inventory-item-supplier-response.dto';
import { Injectable, Logger } from '@nestjs/common';
import { type SearchState, type SortCondition } from '@vritti/api-sdk/conditions';
import { type TableFilters, TableStateService } from '@vritti/api-sdk/data-table';
import { NatsClientService } from '@vritti/api-sdk/nats';
import type { CreateResponseDto, SuccessResponseDto } from '@vritti/api-sdk/responses';

@Injectable()
export class SiteInventoryItemsGatewayService {
  private readonly logger = new Logger(SiteInventoryItemsGatewayService.name);

  constructor(
    private readonly nats: NatsClientService,
    private readonly tableStateService: TableStateService,
  ) {}

  // Every master item with the site's stock levels for it and its stock on hand, split by location
  async findForStockTable(userId: string): Promise<SiteStockTableResponseDto> {
    this.logger.log('site.inventoryItems.stockTable');
    const { state, activeViewId } = await this.tableStateService.getTableState(userId, 'commerce-site-inventory-items');

    const { result, count } = await this.nats.send<{ result: SiteStockTableRowDto[]; count: number }>(
      'commerce',
      'site.inventoryItems.stockTable',
      state,
    );

    return { result, count, state, activeViewId };
  }

  // Keyset/cursor Relay connection for the mobile infinite feed (GraphQL-only — no REST route).
  async findForFeed(query: {
    filters: TableFilters;
    search?: SearchState | null;
    sort?: SortCondition[];
    limit?: number;
    cursor?: string;
  }): Promise<{
    edges: { cursor: string; node: SiteInventoryItemResponseDto }[];
    pageInfo: { hasNextPage: boolean; endCursor: string | null };
  }> {
    this.logger.log('org.inventoryItems.feed');
    return this.nats.send('commerce', 'org.inventoryItems.feed', query);
  }

  // Creates a new inventory item
  async create(dto: CreateSiteInventoryItemDto): Promise<CreateResponseDto<SiteInventoryItemResponseDto>> {
    this.logger.log(`org.inventoryItems.create — name: ${dto.name}, sku: ${dto.sku}`);
    return this.nats.send('commerce', 'org.inventoryItems.create', { ...dto, createOffering: false });
  }

  // Sets a master inventory item's stock levels at the current site
  setStockLevels(inventoryItemId: string, dto: CreateSiteStockLevelsDto): Promise<CreateResponseDto<{ id: string }>> {
    this.logger.log(`site.inventoryItems.stockLevels.create — inventoryItemId: ${inventoryItemId}`);
    return this.nats.send('commerce', 'site.inventoryItems.stockLevels.create', { inventoryItemId, ...dto });
  }

  // Returns an inventory item's stock levels at the current site, or null while none are set
  findStockLevels(inventoryItemId: string): Promise<InventoryItemSiteStockLevelResponseDto | null> {
    this.logger.log(`site.inventoryItems.stockLevels.find — inventoryItemId: ${inventoryItemId}`);
    return this.nats.send('commerce', 'site.inventoryItems.stockLevels.find', { inventoryItemId });
  }

  // Removes an inventory item's stock levels at the current site
  removeStockLevels(inventoryItemId: string): Promise<SuccessResponseDto> {
    this.logger.log(`site.inventoryItems.stockLevels.delete — inventoryItemId: ${inventoryItemId}`);
    return this.nats.send('commerce', 'site.inventoryItems.stockLevels.delete', { inventoryItemId });
  }

  // Updates an inventory item's stock levels at the current site
  updateStockLevels(inventoryItemId: string, dto: UpdateSiteStockLevelsDto): Promise<SuccessResponseDto> {
    this.logger.log(`site.inventoryItems.stockLevels.update — inventoryItemId: ${inventoryItemId}`);
    return this.nats.send('commerce', 'site.inventoryItems.stockLevels.update', { inventoryItemId, ...dto });
  }

  // Returns supplier links for a given inventory item, table-shaped
  async findSuppliersTable(inventoryItemId: string, userId: string): Promise<InventoryItemSupplierTableResponseDto> {
    this.logger.log(`inventoryItems.suppliersTable — inventoryItemId: ${inventoryItemId}`);
    const { state, activeViewId } = await this.tableStateService.getTableState(
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

  // Keyset Relay connection of an item's supplier links for the mobile infinite feed (mirrors findStockLevelsForFeed).
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
  async findById(id: string): Promise<SiteInventoryItemResponseDto> {
    this.logger.log(`inventoryItems.findById — id: ${id}`);
    return this.nats.send('commerce', 'site.inventoryItems.findById', { id });
  }

  // Returns paginated ledger entries for an inventory item data table
  async findLedgerForTable(inventoryItemId: string, userId: string): Promise<InventoryItemLedgerTableResponseDto> {
    this.logger.log('site.inventoryItems.ledgerTable');
    const { state, activeViewId } = await this.tableStateService.getTableState(
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

  // Keyset Relay connection of an item's ledger entries for the mobile infinite feed (mirrors findStockLevelsForFeed).
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

  // Keyset Relay connection of per-location stock levels for the mobile infinite feed (a single item can be stocked in
  // >100 locations).
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
    const { state, activeViewId } = await this.tableStateService.getTableState(
      userId,
      `inventory-item-${inventoryItemId}-quants`,
    );

    const { result, count } = await this.nats.send<{
      result: InventoryItemQuantResponseDto[];
      count: number;
    }>('commerce', 'site.inventoryItems.quantsTable', { inventoryItemId, ...state });

    return { result, count, state, activeViewId };
  }

  // Keyset Relay connection of an item's quants for the mobile infinite feed (mirrors findStockLevelsForFeed).
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
    const { state, activeViewId } = await this.tableStateService.getTableState(
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
    const { state, activeViewId } = await this.tableStateService.getTableState(
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
  // findStockLevelsForFeed).
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
    dto: CreateInventoryItemLocationDto,
  ): Promise<CreateResponseDto<InventoryItemLocationResponseDto>> {
    this.logger.log(`inventoryItems.addLocation — inventoryItemId: ${inventoryItemId}`);
    return this.nats.send('commerce', 'site.inventoryItems.addLocation', { inventoryItemId, ...dto });
  }

  // Updates an item-location config
  async updateItemLocation(id: string, dto: UpdateInventoryItemLocationDto): Promise<SuccessResponseDto> {
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
    const { state, activeViewId } = await this.tableStateService.getTableState(
      userId,
      `inventory-item-${inventoryItemId}-uom-overrides`,
    );

    const { result, count } = await this.nats.send<{
      result: SiteInventoryItemUomConversionResponseDto[];
      count: number;
    }>('commerce', 'org.inventoryItems.uom.table', { inventoryItemId, ...state });

    return { result, count, state, activeViewId };
  }

  // Lean list of an item's UOM conversion overrides for the mobile detail tab — skips the web DataTableState machinery
  // (no per-user saved views).
  async findUomConversions(inventoryItemId: string): Promise<SiteInventoryItemUomConversionResponseDto[]> {
    this.logger.log(`org.inventoryItems.uom.table (list) — inventoryItemId: ${inventoryItemId}`);
    const { result } = await this.nats.send<{ result: SiteInventoryItemUomConversionResponseDto[]; count: number }>(
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
  ): Promise<CreateResponseDto<SiteInventoryItemUomConversionResponseDto>> {
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
  async update(id: string, dto: UpdateSiteInventoryItemDto): Promise<SuccessResponseDto> {
    this.logger.log(`org.inventoryItems.update — id: ${id}`);
    return this.nats.send('commerce', 'org.inventoryItems.update', { id, ...dto });
  }

  // Deletes an inventory item
  async delete(id: string): Promise<SuccessResponseDto> {
    this.logger.log(`org.inventoryItems.delete — id: ${id}`);
    return this.nats.send('commerce', 'org.inventoryItems.delete', { id });
  }
}
