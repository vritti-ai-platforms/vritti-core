import { Injectable, Logger } from '@nestjs/common';
import {
  CursorCodec,
  type FieldMap,
  FilterProcessor,
  type KeysetOrderBy,
  KeysetProcessor,
  PrimaryDatabaseService,
  type SelectOptionsQueryDto,
  type SelectQueryResult,
  type TableViewState,
} from '@vritti/api-sdk/database';
import Decimal from '@vritti/api-sdk/decimal';
import { and, asc, desc, eq, ilike, or, type SQL } from '@vritti/api-sdk/drizzle-orm';
import { BadRequestException, NotFoundException } from '@vritti/api-sdk/exceptions';
import {
  CostDistributionMethodValues,
  type CostSourceType,
  CostSourceTypeValues,
  type InventoryItemLedgerReferenceType,
  type InventoryItemLedgerType,
  type InventoryItemLot,
  type InventoryItemQuant,
  type InventoryItemSerial,
  type InventoryTracking,
  InventoryTrackingValues,
  inventoryItemLots,
  inventoryItemQuants,
  inventoryItems,
  inventoryStockLevels,
  locations,
  uom,
} from '@/db/schema';
import { GoodsReceiptItemQuantsDto } from '../dto/entity/goods-receipt-item-quants.dto';
import { InventoryItemQuantDto, LocationStockDto } from '../dto/entity/inventory-item-quant.dto';
import { LocationItemDto } from '../dto/entity/location-item.dto';
import { LocationItemQuantDto } from '../dto/entity/location-item-quant.dto';
import { InventoryItemCostsDomainRepository } from '../repositories/inventory-item-costs.repository';
import { InventoryItemQuantsDomainRepository } from '../repositories/inventory-item-quants.repository';

export type CreateQuantParams = {
  inventoryItemId: string;
  locationId: string;
  tracking: InventoryTracking;
  // `quantity` is in the inventory item's PRIMARY UOM.
  quantity: number;
  // Unit cost (site-currency minor units), set at creation and always > 0. Part of the cost-batch identity:
  // stock at the same (item, location, lot) but a different unit cost stays a separate quant.
  unitCost: bigint;
  // for tracking='lot' or 'lot_serial': lotId must be pre-resolved by the app-layer
  lotId?: string | null;
  // retained for backward compat with createQuant callers that pass lot/serialNumbers
  lot?: { lotNumber: string; manufacturingDate?: string | null; expiryDate: string };
  // for tracking='serial' or 'lot_serial': required, length must equal quantity
  serialNumbers?: string[];
  // Provenance of the cost batch's first creation (informational).
  costCurrency?: string;
  sourceType?: CostSourceType;
  sourceId?: string;
  // GR publish owns the cost/value via its allocation pass; skip the unit_cost × qty baseline here.
  skipCostBaseline?: boolean;
};

export type AdjustQuantParams =
  | { tracking: 'quantity' | 'lot'; delta: number }
  | { tracking: 'serial' | 'lot_serial'; serials: string[] };

@Injectable()
export class InventoryItemQuantsDomainService {
  private readonly logger = new Logger(InventoryItemQuantsDomainService.name);

  private static readonly QUANTS_FIELD_MAP: FieldMap = {
    locationName: { column: locations.name, type: 'string' },
    locationId: { column: inventoryItemQuants.locationId, type: 'string' },
    lotId: { column: inventoryItemQuants.lotId, type: 'string' },
  };
  // Search/sort for a location's grouped items table is on the joined inventory item name + code.
  private static readonly LOCATION_ITEMS_FIELD_MAP: FieldMap = {
    itemName: { column: inventoryItems.name, type: 'string' },
    itemCode: { column: inventoryItems.code, type: 'string' },
  };

  constructor(
    private readonly database: PrimaryDatabaseService,
    private readonly repository: InventoryItemQuantsDomainRepository,
    private readonly costsRepository: InventoryItemCostsDomainRepository,
  ) {}

  // Rounds unit_cost × qty to whole minor units (ROUND_HALF_UP).
  private roundMinor(unitCost: bigint, qty: number): bigint {
    return BigInt(new Decimal(unitCost.toString()).times(qty).toDecimalPlaces(0, Decimal.ROUND_HALF_UP).toFixed(0));
  }

  // Adds a freshly-allocated cost slice to a quant's cost + value (GR publish allocation pass).
  async addQuantCostValue(quantId: string, addCost: bigint, addValue: bigint): Promise<InventoryItemQuant> {
    return this.repository.addQuantCostValue(quantId, addCost, addValue);
  }

  // Quants produced by a GR-item (post-publish) with their landed cost, for the Items Cost dialog.
  async findCostsByGrItemId(grItemId: string): Promise<GoodsReceiptItemQuantsDto> {
    const rows = await this.repository.findCostsByGrItemId(grItemId);
    return GoodsReceiptItemQuantsDto.from(rows);
  }

  // Returns a location's stocked items (grouped, non-zero), table-shaped with FilterProcessor search/sort.
  async findItemsForLocationTable(
    locationId: string,
    state: TableViewState,
  ): Promise<{ result: LocationItemDto[]; count: number }> {
    this.logger.log(`findItemsForLocationTable — locationId=${locationId}`);
    const filterWhere = FilterProcessor.buildWhere(
      state.filters,
      InventoryItemQuantsDomainService.LOCATION_ITEMS_FIELD_MAP,
    );
    const searchWhere = FilterProcessor.buildSearch(
      state.search,
      InventoryItemQuantsDomainService.LOCATION_ITEMS_FIELD_MAP,
    );
    const where = and(filterWhere, searchWhere) || undefined;
    const orderBy = FilterProcessor.buildOrderBy(state.sort, InventoryItemQuantsDomainService.LOCATION_ITEMS_FIELD_MAP);
    const { limit = 20, offset = 0 } = state.pagination;

    const { result, count } = await this.repository.findItemsForLocation(locationId, {
      where,
      orderBy: orderBy.length > 0 ? orderBy : undefined,
      limit,
      offset,
    });

    return { result: result.map((row) => LocationItemDto.from(row)), count };
  }

  // Returns the per-quant breakdown for a single item within a location.
  async findItemBreakdownForLocation(locationId: string, itemId: string): Promise<LocationItemQuantDto[]> {
    this.logger.log(`findItemBreakdownForLocation — locationId=${locationId}, itemId=${itemId}`);
    const rows = await this.repository.findItemBreakdownForLocation(locationId, itemId);
    return rows.map((row) => LocationItemQuantDto.from(row));
  }

  // Creates a new quant in its own transaction and writes the ledger entry. Tracking-aware.
  // For lot/lot_serial tracking: caller must pass a pre-resolved `lotId` (app-layer resolves/creates the lot).
  // For serial tracking: caller may pass `serialNumbers`.
  // For quantity tracking: neither lotId nor serialNumbers are needed.
  async createQuant(params: {
    inventoryItemId: string;
    locationId: string;
    quantity: number;
    unitCost: bigint;
    lotId?: string | null;
    serialNumbers?: string[];
    costCurrency?: string;
    sourceType?: CostSourceType;
    sourceId?: string;
    type: InventoryItemLedgerType;
    referenceType?: InventoryItemLedgerReferenceType;
    referenceId?: string;
    notes?: string;
  }): Promise<{ quant: InventoryItemQuant }> {
    const tracking = await this.repository.findItemTracking(params.inventoryItemId);
    const provenance = {
      unitCost: params.unitCost,
      costCurrency: params.costCurrency,
      sourceType: params.sourceType,
      sourceId: params.sourceId,
    };
    let createParams: CreateQuantParams;
    if (tracking === InventoryTrackingValues.QUANTITY) {
      createParams = {
        inventoryItemId: params.inventoryItemId,
        locationId: params.locationId,
        tracking,
        quantity: params.quantity,
        ...provenance,
      };
    } else if (tracking === InventoryTrackingValues.SERIAL) {
      createParams = {
        inventoryItemId: params.inventoryItemId,
        locationId: params.locationId,
        tracking,
        quantity: params.quantity,
        serialNumbers: params.serialNumbers,
        ...provenance,
      };
    } else {
      createParams = {
        inventoryItemId: params.inventoryItemId,
        locationId: params.locationId,
        tracking,
        quantity: params.quantity,
        lotId: params.lotId,
        serialNumbers: params.serialNumbers,
        ...provenance,
      };
    }

    const quant = await this.database.runInTransaction(async () => {
      const { quant: q } = await this.createQuantScoped(createParams);
      return q;
    });

    this.logger.log(
      `Created quant ${quant.id} for item ${params.inventoryItemId} (${params.type}, qty: ${params.quantity})`,
    );
    return { quant };
  }

  // Creates or upserts a quant within a transaction. Tracking-aware:
  //   'quantity':   lotId=null, upsert by (item, location)
  //   'lot':        uses pre-resolved lotId passed by the app-layer, upsert by (item, location, lotId)
  //   'lot_serial': uses pre-resolved lotId passed by the app-layer, upsert quant, then inserts N quant_items with serials
  //   'serial':     lotId=null, upsert quant by (item, location), then inserts N quant_items with serials
  // No ledger — caller handles it. App-layer is responsible for resolving/creating the lot and passing lotId.
  async createQuantScoped(
    params: CreateQuantParams,
  ): Promise<{ quant: InventoryItemQuant; lot: InventoryItemLot | null; quantItems: InventoryItemSerial[] }> {
    this.validateCreateParams(params);

    return this.database.runInTransaction(async () => {
      if (
        (params.tracking === InventoryTrackingValues.LOT || params.tracking === InventoryTrackingValues.LOT_SERIAL) &&
        params.lotId == null
      ) {
        throw new BadRequestException(
          'lotId is required for tracking=lot or lot_serial. App-layer must resolve the lot.',
        );
      }

      const lotId = params.lotId ?? null;

      // Merge only into a quant with the SAME unit cost — a different cost ⇒ separate segment.
      const existing = await this.repository.findByItemLocationLotCost(
        params.inventoryItemId,
        params.locationId,
        lotId,
        params.unitCost,
      );

      // GR publish passes skipCostBaseline: the allocation pass sets quant_cost/value exactly.
      const baseline = params.skipCostBaseline ? 0n : this.roundMinor(params.unitCost, params.quantity);

      let quant: InventoryItemQuant;
      if (existing) {
        quant = await this.repository.updateQuantity(existing.id, params.quantity);
        if (baseline > 0n) {
          quant = await this.repository.addQuantCostValue(existing.id, baseline, baseline);
        }
      } else {
        quant = await this.repository.createQuant({
          inventoryItemId: params.inventoryItemId,
          locationId: params.locationId,
          lotId,
          quantity: params.quantity,
          unitCost: params.unitCost,
          costCurrency: params.costCurrency,
          sourceType: params.sourceType,
          sourceId: params.sourceId,
          quantCost: baseline,
          quantValue: baseline,
        });
      }

      // Non-GR creation books its baseline as its own cost header (transfers/conversions create a
      // fresh header for the destination quant's value; the source outflow already reduced its
      // value, so system cost nets out). Junction is additive — a quant can hold many cost rows.
      if (baseline > 0n) {
        await this.bookBaselineCost(quant, baseline, params);
      }

      let quantItems: InventoryItemSerial[] = [];
      if (
        params.tracking === InventoryTrackingValues.SERIAL ||
        params.tracking === InventoryTrackingValues.LOT_SERIAL
      ) {
        const serials = params.serialNumbers ?? [];
        quantItems = await this.repository.insertQuantItems(
          serials.map((serialNumber) => ({
            inventoryItemQuantId: quant.id,
            inventoryItemId: params.inventoryItemId,
            serialNumber,
          })),
        );
      }

      return { quant, lot: null, quantItems };
    });
  }

  // Creates a cost header + one junction row for a non-GR baseline; skips gracefully when no ITEM
  // category is seeded or no currency is known (header.currency_code is NOT NULL).
  private async bookBaselineCost(
    quant: InventoryItemQuant,
    baseline: bigint,
    params: CreateQuantParams,
  ): Promise<void> {
    const currencyCode = params.costCurrency ?? quant.costCurrency;
    if (!currencyCode) return;
    const categoryId = await this.costsRepository.findItemCategoryId();
    if (!categoryId) return;
    const costId = await this.costsRepository.insertCost({
      categoryId,
      totalAmount: baseline,
      currencyCode,
      sourceType: params.sourceType ?? CostSourceTypeValues.MANUAL_ADJUSTMENT,
      sourceId: params.sourceId ?? quant.id,
      distributionMethod: CostDistributionMethodValues.EQUAL,
      unallocatedAmount: 0n,
    });
    await this.costsRepository.insertQuantCosts([{ quantId: quant.id, costId, allocatedAmount: baseline }]);
  }

  private validateCreateParams(params: CreateQuantParams): void {
    if (params.quantity <= 0) {
      throw new BadRequestException('Quantity must be positive.');
    }
    if (params.unitCost <= 0n) {
      throw new BadRequestException('Unit cost must be a positive amount.');
    }
    if (params.tracking === InventoryTrackingValues.QUANTITY) {
      if (params.lot) throw new BadRequestException('lot must not be provided for tracking=quantity.');
      if (params.serialNumbers?.length) {
        throw new BadRequestException('serialNumbers must not be provided for tracking=quantity.');
      }
      return;
    }
    if (params.tracking === InventoryTrackingValues.LOT) {
      if (!params.lot?.lotNumber && params.lotId == null) {
        throw new BadRequestException('lot.lotNumber or a pre-resolved lotId is required for tracking=lot.');
      }
      if (params.serialNumbers?.length) {
        throw new BadRequestException('serialNumbers must not be provided for tracking=lot.');
      }
      return;
    }
    if (params.tracking === InventoryTrackingValues.SERIAL) {
      if (params.lot) throw new BadRequestException('lot must not be provided for tracking=serial.');
      const serials = params.serialNumbers ?? [];
      if (serials.length !== params.quantity) {
        throw new BadRequestException(
          `serialNumbers.length (${serials.length}) must equal quantity (${params.quantity}).`,
        );
      }
      const unique = new Set(serials);
      if (unique.size !== serials.length) {
        throw new BadRequestException('serialNumbers must be unique within the same quant creation.');
      }
      return;
    }
    // LOT_SERIAL: lot (or pre-resolved lotId) required + serials required
    if (!params.lot?.lotNumber && params.lotId == null) {
      throw new BadRequestException('lot.lotNumber or a pre-resolved lotId is required for tracking=lot_serial.');
    }
    const serials = params.serialNumbers ?? [];
    if (serials.length !== params.quantity) {
      throw new BadRequestException(
        `serialNumbers.length (${serials.length}) must equal quantity (${params.quantity}).`,
      );
    }
    const unique = new Set(serials);
    if (unique.size !== serials.length) {
      throw new BadRequestException('serialNumbers must be unique within the same quant creation.');
    }
  }

  // Adjusts a quant in its own transaction and writes the ledger entry. Tracking-aware.
  async adjustQuant(params: {
    quantId: string;
    quantity: number; // signed; for tracking='serial' should equal -serials.length
    serials?: string[]; // tracking='serial' only
    type: InventoryItemLedgerType;
    referenceType?: InventoryItemLedgerReferenceType;
    referenceId?: string;
    notes?: string;
  }): Promise<{ quant: InventoryItemQuant }> {
    const quant = await this.repository.findById(params.quantId);
    if (!quant) throw new NotFoundException('Quant not found.');

    const tracking = await this.repository.findItemTracking(quant.inventoryItemId);

    const adjustParams: AdjustQuantParams =
      tracking === InventoryTrackingValues.SERIAL || tracking === InventoryTrackingValues.LOT_SERIAL
        ? { tracking, serials: params.serials ?? [] }
        : { tracking, delta: params.quantity };

    const updated = await this.database.runInTransaction(async () => {
      const { quant: u } = await this.adjustQuantScoped(params.quantId, adjustParams);
      return u;
    });

    this.logger.log(`Adjusted quant ${updated.id} by ${params.quantity} (${params.type})`);
    return { quant: updated };
  }

  // Adjusts a quant within a transaction (no ledger — caller handles it).
  //   'quantity' | 'lot':         delta-based adjustment; auto-deletes quant when quantity <= 0
  //   'serial' | 'lot_serial':    resolves serials → consumes those quant_items; auto-deletes at zero
  async adjustQuantScoped(
    quantId: string,
    params: AdjustQuantParams,
  ): Promise<{ quant: InventoryItemQuant; consumedItems: InventoryItemSerial[] }> {
    return this.database.runInTransaction(async () => {
      // PR4 (cost-tracking foundation, plan §6): zero-qty quants STAY — cost history, returns,
      // and period-end snapshots all read this row. The old auto-delete-on-zero behavior was
      // removed; the row's cost_currency / source_type / source_id keep the audit trail intact
      // even when quantity reaches 0.
      switch (params.tracking) {
        case 'quantity':
        case 'lot': {
          let quant = await this.repository.updateQuantity(quantId, params.delta);
          // Outflow: decrement value (clears to 0 on final depletion). Inflow (rare): add baseline.
          if (params.delta < 0) {
            quant = await this.repository.applyOutflowValue(quantId, Math.abs(params.delta));
          } else if (params.delta > 0) {
            const add = this.roundMinor(quant.unitCost, params.delta);
            quant = await this.repository.addQuantCostValue(quantId, add, add);
          }
          return { quant, consumedItems: [] };
        }
        case 'serial':
        case 'lot_serial': {
          const items = await this.repository.loadAvailableQuantItemsBySerials(quantId, params.serials);
          if (items.length !== params.serials.length) {
            throw new BadRequestException('Some serials are not AVAILABLE or do not belong to the given quant.');
          }
          await this.repository.consumeQuantItems(items.map((i) => i.id));
          await this.repository.updateQuantity(quantId, -items.length);
          const quant = await this.repository.applyOutflowValue(quantId, items.length);
          return { quant, consumedItems: items };
        }
      }
    });
  }

  // Loads the lot for a quant. Useful for stock transfers preserving source lot at destination.
  async loadLotByQuantId(quantId: string): Promise<InventoryItemLot | null> {
    const quant = await this.repository.findById(quantId);
    if (!quant?.lotNumber) return null;
    return {
      id: quant.lotId as string,
      organizationId: '',
      siteId: '',
      inventoryItemId: quant.inventoryItemId,
      lotNumber: quant.lotNumber,
      manufacturingDate: quant.manufacturingDate ?? null,
      expiryDate: quant.expiryDate ?? null,
      createdAt: quant.createdAt,
      updatedAt: quant.updatedAt,
    } as InventoryItemLot;
  }

  async findQuantsForTable(
    inventoryItemId: string,
    state: TableViewState,
  ): Promise<{ result: InventoryItemQuantDto[]; count: number }> {
    const filterWhere = FilterProcessor.buildWhere(state.filters, InventoryItemQuantsDomainService.QUANTS_FIELD_MAP);
    const searchWhere = FilterProcessor.buildSearch(state.search, InventoryItemQuantsDomainService.QUANTS_FIELD_MAP);
    const where = and(filterWhere, searchWhere) || undefined;
    const orderBy = FilterProcessor.buildOrderBy(state.sort, InventoryItemQuantsDomainService.QUANTS_FIELD_MAP);
    const { limit = 20, offset = 0 } = state.pagination;

    const { result, count } = await this.repository.findQuantsForTable(inventoryItemId, {
      where,
      orderBy: orderBy.length > 0 ? orderBy : undefined,
      limit,
      offset,
    });

    return { result: result.map((row) => InventoryItemQuantDto.from(row, true)), count };
  }

  // Keyset page of an item's quants for the mobile Relay feed (read-only). Ordered by (createdAt desc,
  // id asc); the cursor encodes those boundary values (via CursorCodec) so pages don't skip/duplicate on
  // concurrent insert/delete.
  async findQuantsFeed(
    inventoryItemId: string,
    limit: number,
    cursor?: string,
  ): Promise<{
    edges: { cursor: string; node: InventoryItemQuantDto }[];
    pageInfo: { hasNextPage: boolean; endCursor: string | null };
  }> {
    const orderByEntries: (KeysetOrderBy & { key: string })[] = [
      { column: inventoryItemQuants.createdAt, direction: 'desc', key: 'createdAt' },
      { column: inventoryItemQuants.id, direction: 'asc', key: 'id' },
    ];
    const orderBy = orderByEntries.map((e) => (e.direction === 'asc' ? asc(e.column) : desc(e.column)));
    const cursorWhere = cursor ? KeysetProcessor.buildAfter(orderByEntries, CursorCodec.decode(cursor)) : undefined;
    const where = and(eq(inventoryItemQuants.inventoryItemId, inventoryItemId), cursorWhere);

    const { rows, hasMore } = await this.repository.findQuantsFeedKeyset({ where, orderBy, limit });
    const edges = rows.map((row) => ({
      cursor: CursorCodec.encode(orderByEntries.map((e) => (row as Record<string, unknown>)[e.key])),
      node: InventoryItemQuantDto.from(row, false),
    }));
    return {
      edges,
      pageInfo: { hasNextPage: hasMore, endCursor: edges.length > 0 ? edges[edges.length - 1].cursor : null },
    };
  }

  async findQuantById(id: string): Promise<InventoryItemQuantDto> {
    const row = await this.repository.findById(id);
    if (!row) throw new NotFoundException('Quant not found.');
    return InventoryItemQuantDto.from(row, true);
  }

  async findLocationStockByInventoryItemId(inventoryItemId: string): Promise<LocationStockDto[]> {
    const rows = await this.repository.findLocationStockByInventoryItemId(inventoryItemId);
    return rows.map((row) => {
      const dto = new LocationStockDto();
      dto.locationId = row.locationId;
      dto.locationName = row.locationName ?? null;
      dto.locationPath = row.locationPath ?? null;
      dto.stockedQuantity = Number(row.stockedQuantity);
      dto.reservedQuantity = Number(row.reservedQuantity);
      dto.availableQuantity = Number(row.availableQuantity);
      dto.reorderLevel = row.reorderLevel;
      return dto;
    });
  }

  // Keyset page backing the mobile Relay stock-levels feed. Ordered by (locationName asc, locationId asc);
  // the cursor encodes those boundary values. Node id is composite (item:location) so Apollo keys each row
  // uniquely per item (the view has no own id).
  async findLocationStockFeed(
    inventoryItemId: string,
    limit: number,
    cursor?: string,
  ): Promise<{
    edges: { cursor: string; node: LocationStockDto & { id: string } }[];
    pageInfo: { hasNextPage: boolean; endCursor: string | null };
  }> {
    // Keyset on the real joined `locations` columns (the view's own columns are aliased SQL, not
    // Columns). locations.id equals the view's locationId via the join, so it's a stable unique tiebreaker.
    const orderByEntries: (KeysetOrderBy & { key: string })[] = [
      { column: locations.name, direction: 'asc', key: 'locationName' },
      { column: locations.id, direction: 'asc', key: 'locationId' },
    ];
    const orderBy = orderByEntries.map((e) => (e.direction === 'asc' ? asc(e.column) : desc(e.column)));
    const cursorWhere = cursor ? KeysetProcessor.buildAfter(orderByEntries, CursorCodec.decode(cursor)) : undefined;
    const baseWhere = eq(inventoryStockLevels.inventoryItemId, inventoryItemId);
    const where = cursorWhere ? (and(baseWhere, cursorWhere) as SQL) : baseWhere;

    const { rows, hasMore } = await this.repository.findLocationStockKeyset({ where, orderBy, limit });
    const edges = rows.map((row) => {
      const node: LocationStockDto & { id: string } = {
        id: `${inventoryItemId}:${row.locationId}`,
        locationId: row.locationId,
        locationName: row.locationName ?? null,
        locationPath: row.locationPath ?? null,
        stockedQuantity: Number(row.stockedQuantity),
        reservedQuantity: Number(row.reservedQuantity),
        availableQuantity: Number(row.availableQuantity),
        reorderLevel: row.reorderLevel,
      };
      return {
        cursor: CursorCodec.encode(orderByEntries.map((e) => (row as Record<string, unknown>)[e.key])),
        node,
      };
    });
    return {
      edges,
      pageInfo: { hasNextPage: hasMore, endCursor: edges.length > 0 ? edges[edges.length - 1].cursor : null },
    };
  }

  async findForSelect(query: SelectOptionsQueryDto & { inventoryItemId?: string }): Promise<SelectQueryResult> {
    const search = query.search?.trim();
    const hasItemFilter = !!query.inventoryItemId;
    // inventoryItems is listed first so resolveColumn('name') resolves to inventoryItems.name, not locations.name
    const joins = [
      { table: inventoryItems, on: eq(inventoryItemQuants.inventoryItemId, inventoryItems.id), type: 'left' as const },
      { table: inventoryItemLots, on: eq(inventoryItemQuants.lotId, inventoryItemLots.id), type: 'left' as const },
      { table: locations, on: eq(inventoryItemQuants.locationId, locations.id), type: 'left' as const },
      { table: uom, on: eq(inventoryItems.uomId, uom.id), type: 'left' as const },
    ];
    return this.repository.findForSelect({
      value: query.valueKey || 'id',
      label: query.labelKey || (hasItemFilter ? 'lotNumber' : 'name'),
      description: query.descriptionKey || (hasItemFilter ? 'pathBreadcrumb' : 'lotNumber'),
      additionalKeys: query.additionalKeys || (hasItemFilter ? 'quantity,symbol' : 'quantity,pathBreadcrumb'),
      values: query.values,
      excludeIds: query.excludeIds,
      limit: query.limit,
      offset: query.offset,
      orderByKey: query.orderByKey || 'createdAt',
      orderDirection: query.orderDirection || 'desc',
      where: hasItemFilter ? { inventoryItemId: query.inventoryItemId } : undefined,
      joins,
      conditions: search
        ? hasItemFilter
          ? [or(ilike(locations.name, `%${search}%`), ilike(inventoryItemLots.lotNumber, `%${search}%`)) as SQL]
          : [or(ilike(inventoryItems.name, `%${search}%`), ilike(inventoryItemLots.lotNumber, `%${search}%`)) as SQL]
        : undefined,
    });
  }
}
