import { Injectable, Logger } from '@nestjs/common';
import {
  type CreateResponseDto,
  DataTableStateService,
  NatsClientService,
  SelectOptionsQueryDto,
  type SelectQueryResult,
  type SuccessResponseDto,
} from '@vritti/api-sdk';
import type { CreateInventoryItemDto } from '../dto/request/create-inventory-item.dto';
import type { CreateInventoryItemUomConversionDto } from '../dto/request/create-inventory-item-uom-conversion.dto';
import type { UpdateInventoryItemDto } from '../dto/request/update-inventory-item.dto';
import type { UpdateInventoryItemUomConversionDto } from '../dto/request/update-inventory-item-uom-conversion.dto';
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
import type { InventoryLedgerResponseDto } from '../dto/response/inventory-ledger-response.dto';
import type { InventoryLedgerTableResponseDto } from '../dto/response/inventory-ledger-table-response.dto';
import type { InventoryLevelResponseDto } from '../dto/response/inventory-level-response.dto';
import type { InventoryLevelTableResponseDto } from '../dto/response/inventory-level-table-response.dto';

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

  // Returns paginated inventory item options; filters by PO when poId provided, by supplier when supplierId provided, else all
  async select(params: SelectOptionsQueryDto, supplierId?: string, poId?: string): Promise<SelectQueryResult> {
    if (poId) {
      this.logger.log(`inventoryItems.selectByPurchaseOrder — poId: ${poId}`);
      return this.nats.send('commerce', 'inventoryItems.selectByPurchaseOrder', { ...params, poId });
    }
    if (supplierId) {
      this.logger.log(`inventoryItems.selectBySupplier — supplierId: ${supplierId}`);
      return this.nats.send('commerce', 'inventoryItems.selectBySupplier', { ...params, supplierId });
    }
    this.logger.log('inventoryItems.select');
    return this.nats.send('commerce', 'inventoryItems.select', params);
  }

  // Creates a new inventory item
  async create(dto: CreateInventoryItemDto): Promise<CreateResponseDto<InventoryItemResponseDto>> {
    this.logger.log(`inventoryItems.create — name: ${dto.name}, code: ${dto.code}`);
    return this.nats.send('commerce', 'inventoryItems.create', dto);
  }

  // Returns supplier links for a given inventory item, table-shaped
  async findSuppliersTable(itemId: string, userId: string): Promise<InventoryItemSupplierTableResponseDto> {
    this.logger.log(`inventoryItems.suppliersTable — itemId: ${itemId}`);
    const { state, activeViewId } = await this.dataTableStateService.getCurrentState(
      userId,
      `commerce-inventory-item-${itemId}-suppliers`,
    );

    const { result, count } = await this.nats.send<{ result: InventoryItemSupplierResponseDto[]; count: number }>(
      'commerce',
      'inventoryItems.suppliersTable',
      { inventoryItemId: itemId, ...state },
    );

    return { result, count, state, activeViewId };
  }

  // Returns the UOM IDs allowed to transact for a given inventory item
  async findAllowedUomIds(id: string): Promise<string[]> {
    this.logger.log(`inventoryItems.allowedUomIds — id: ${id}`);
    return this.nats.send('commerce', 'inventoryItems.allowedUomIds', { id });
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

  // Returns paginated stock levels for an inventory item data table
  async findLevelsForTable(itemId: string, userId: string): Promise<InventoryLevelTableResponseDto> {
    this.logger.log('inventoryItems.levelsTable');
    const { state, activeViewId } = await this.dataTableStateService.getCurrentState(
      userId,
      `inventory-item-${itemId}-levels`,
    );

    const { result, count } = await this.nats.send<{ result: InventoryLevelResponseDto[]; count: number }>(
      'commerce',
      'inventoryItems.levelsTable',
      { itemId, ...state },
    );

    return { result, count, state, activeViewId };
  }

  // Returns paginated ledger entries for an inventory item data table
  async findLedgerForTable(itemId: string, userId: string): Promise<InventoryLedgerTableResponseDto> {
    this.logger.log('inventoryItems.ledgerTable');
    const { state, activeViewId } = await this.dataTableStateService.getCurrentState(
      userId,
      `inventory-item-${itemId}-ledger`,
    );

    const { result, count } = await this.nats.send<{ result: InventoryLedgerResponseDto[]; count: number }>(
      'commerce',
      'inventoryItems.ledgerTable',
      { itemId, ...state },
    );

    return { result, count, state, activeViewId };
  }

  // Returns location-wise stock aggregates for an inventory item, sourced from inventory_item_quants.
  async findStocks(itemId: string): Promise<InventoryItemStockResponseDto[]> {
    this.logger.log(`inventoryItems.stocks — itemId: ${itemId}`);
    return this.nats.send('commerce', 'inventoryItems.stocks', { itemId });
  }

  // Returns paginated quants for an inventory item data table
  async findQuantsForTable(itemId: string, userId: string): Promise<InventoryItemQuantTableResponseDto> {
    this.logger.log('inventoryItems.quantsTable');
    const { state, activeViewId } = await this.dataTableStateService.getCurrentState(
      userId,
      `inventory-item-${itemId}-quants`,
    );

    const { result, count } = await this.nats.send<{
      result: InventoryItemQuantResponseDto[];
      count: number;
    }>('commerce', 'inventoryItems.quantsTable', { itemId, ...state });

    return { result, count, state, activeViewId };
  }

  // Returns paginated lots for an inventory item data table
  async findLotsForTable(itemId: string, userId: string): Promise<InventoryItemLotTableResponseDto> {
    this.logger.log('inventoryItems.lotsTable');
    const { state, activeViewId } = await this.dataTableStateService.getCurrentState(
      userId,
      `inventory-item-${itemId}-lots`,
    );

    const { result, count } = await this.nats.send<{
      result: InventoryItemLotResponseDto[];
      count: number;
    }>('commerce', 'inventoryItems.lotsTable', { itemId, ...state });

    return { result, count, state, activeViewId };
  }

  // Returns paginated item-location configs for an inventory item
  async findItemLocationsForTable(itemId: string, userId: string): Promise<InventoryItemLocationTableResponseDto> {
    this.logger.log('inventoryItems.locationsTable');
    const { state, activeViewId } = await this.dataTableStateService.getCurrentState(
      userId,
      `inventory-item-${itemId}-locations`,
    );

    const { result, count } = await this.nats.send<{
      result: InventoryItemLocationResponseDto[];
      count: number;
    }>('commerce', 'inventoryItems.locationsTable', { itemId, ...state });

    return { result, count, state, activeViewId };
  }

  // Creates an item-location config for an inventory item
  async createItemLocation(itemId: string, dto: { locationId: string; reorderLevel: number }) {
    this.logger.log(`inventoryItems.addLocation — itemId: ${itemId}`);
    return this.nats.send('commerce', 'inventoryItems.addLocation', { itemId, ...dto });
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
  async findUomConversionsForTable(itemId: string, userId: string) {
    this.logger.log(`inventoryItems.uomConversionsTable — itemId: ${itemId}`);
    const { state, activeViewId } = await this.dataTableStateService.getCurrentState(
      userId,
      `inventory-item-${itemId}-uom-overrides`,
    );

    const { result, count } = await this.nats.send<{ result: InventoryItemUomConversionResponseDto[]; count: number }>(
      'commerce',
      'inventoryItems.uomConversionsTable',
      { itemId, ...state },
    );

    return { result, count, state, activeViewId };
  }

  // Creates a per-item UOM conversion override
  async createUomConversion(
    itemId: string,
    dto: CreateInventoryItemUomConversionDto,
  ): Promise<CreateResponseDto<InventoryItemUomConversionResponseDto>> {
    this.logger.log(`inventoryItems.addUomConversion — itemId: ${itemId}`);
    return this.nats.send('commerce', 'inventoryItems.addUomConversion', { itemId, ...dto });
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
