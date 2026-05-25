import { Injectable, Logger } from '@nestjs/common';
import {
  BadRequestException,
  type FieldMap,
  FilterProcessor,
  NotFoundException,
  PrimaryDatabaseService,
  type SelectOptionsQueryDto,
  type SelectQueryResult,
  type TableViewState,
} from '@vritti/api-sdk';
import { and, eq, ilike, or, type SQL } from '@vritti/api-sdk/drizzle-orm';
import {
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
  locations,
  uom,
} from '@/db/schema';
import { InventoryItemQuantDto, LocationStockDto } from '../dto/entity/inventory-item-quant.dto';
import { InventoryItemQuantsRepository } from '../repositories/inventory-item-quants.repository';

export type CreateQuantParams = {
  inventoryItemId: string;
  locationId: string;
  tracking: InventoryTracking;
  quantity: number;
  // for tracking='lot' or 'lot_serial': lotId must be pre-resolved by the app-layer
  lotId?: string | null;
  // retained for backward compat with createBatch callers that pass lot/serialNumbers
  lot?: { lotNumber: string; manufacturingDate?: string | null; expiryDate: string };
  // for tracking='serial' or 'lot_serial': required, length must equal quantity
  serialNumbers?: string[];
};

export type AdjustQuantParams =
  | { tracking: 'quantity' | 'lot'; delta: number }
  | { tracking: 'serial' | 'lot_serial'; serials: string[] };

@Injectable()
export class InventoryItemQuantsService {
  private readonly logger = new Logger(InventoryItemQuantsService.name);

  private static readonly QUANTS_FIELD_MAP: FieldMap = {
    locationName: { column: locations.name, type: 'string' },
    locationId: { column: inventoryItemQuants.locationId, type: 'string' },
    lotId: { column: inventoryItemQuants.lotId, type: 'string' },
  };

  constructor(
    private readonly database: PrimaryDatabaseService,
    private readonly repository: InventoryItemQuantsRepository,
  ) {}

  // Creates a new quant in its own transaction and writes the ledger entry. Tracking-aware.
  // For lot/lot_serial tracking: caller must pass a pre-resolved `lotId` (app-layer resolves/creates the lot).
  // For serial tracking: caller may pass `serialNumbers`.
  // For quantity tracking: neither lotId nor serialNumbers are needed.
  async createBatch(params: {
    inventoryItemId: string;
    locationId: string;
    quantity: number;
    lotId?: string | null;
    serialNumbers?: string[];
    type: InventoryItemLedgerType;
    referenceType?: InventoryItemLedgerReferenceType;
    referenceId?: string;
    notes?: string;
  }): Promise<{ batch: InventoryItemQuant }> {
    const tracking = await this.repository.findItemTracking(params.inventoryItemId);
    let createParams: CreateQuantParams;
    if (tracking === InventoryTrackingValues.QUANTITY) {
      createParams = {
        inventoryItemId: params.inventoryItemId,
        locationId: params.locationId,
        tracking,
        quantity: params.quantity,
      };
    } else if (tracking === InventoryTrackingValues.SERIAL) {
      createParams = {
        inventoryItemId: params.inventoryItemId,
        locationId: params.locationId,
        tracking,
        quantity: params.quantity,
        serialNumbers: params.serialNumbers,
      };
    } else {
      createParams = {
        inventoryItemId: params.inventoryItemId,
        locationId: params.locationId,
        tracking,
        quantity: params.quantity,
        lotId: params.lotId,
        serialNumbers: params.serialNumbers,
      };
    }

    const quant = await this.database.runInTransaction(async () => {
      const { quant: q } = await this.createBatchScoped(createParams);
      return q;
    });

    this.logger.log(
      `Created quant ${quant.id} for item ${params.inventoryItemId} (${params.type}, qty: ${params.quantity})`,
    );
    return { batch: quant };
  }

  // Creates or upserts a quant within a transaction. Tracking-aware:
  //   'quantity':   lotId=null, upsert by (item, location)
  //   'lot':        uses pre-resolved lotId passed by the app-layer, upsert by (item, location, lotId)
  //   'lot_serial': uses pre-resolved lotId passed by the app-layer, upsert quant, then inserts N quant_items with serials
  //   'serial':     lotId=null, upsert quant by (item, location), then inserts N quant_items with serials
  // No ledger — caller handles it. App-layer is responsible for resolving/creating the lot and passing lotId.
  async createBatchScoped(
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

      const existing = await this.repository.findByItemLocationLot(params.inventoryItemId, params.locationId, lotId);

      let quant: InventoryItemQuant;
      if (existing) {
        quant = await this.repository.updateQuantity(existing.id, String(params.quantity));
      } else {
        quant = await this.repository.createBatch({
          inventoryItemId: params.inventoryItemId,
          locationId: params.locationId,
          lotId,
          quantity: String(params.quantity),
        });
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

  private validateCreateParams(params: CreateQuantParams): void {
    if (params.quantity <= 0) {
      throw new BadRequestException('Quantity must be positive.');
    }
    if (params.tracking === InventoryTrackingValues.QUANTITY) {
      if (params.lot) throw new BadRequestException('lot must not be provided for tracking=quantity.');
      if (params.serialNumbers?.length) {
        throw new BadRequestException('serialNumbers must not be provided for tracking=quantity.');
      }
      return;
    }
    if (params.tracking === InventoryTrackingValues.LOT) {
      if (!params.lot?.lotNumber) {
        throw new BadRequestException('lot.lotNumber is required for tracking=lot.');
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
        throw new BadRequestException('serialNumbers must be unique within the same batch creation.');
      }
      return;
    }
    // LOT_SERIAL: lot required + serials required
    if (!params.lot?.lotNumber) {
      throw new BadRequestException('lot.lotNumber is required for tracking=lot_serial.');
    }
    const serials = params.serialNumbers ?? [];
    if (serials.length !== params.quantity) {
      throw new BadRequestException(
        `serialNumbers.length (${serials.length}) must equal quantity (${params.quantity}).`,
      );
    }
    const unique = new Set(serials);
    if (unique.size !== serials.length) {
      throw new BadRequestException('serialNumbers must be unique within the same batch creation.');
    }
  }

  // Adjusts a quant in its own transaction and writes the ledger entry. Tracking-aware.
  async adjustBatch(params: {
    batchId: string;
    quantity: number; // signed; for tracking='serial' should equal -serials.length
    serials?: string[]; // tracking='serial' only
    type: InventoryItemLedgerType;
    referenceType?: InventoryItemLedgerReferenceType;
    referenceId?: string;
    notes?: string;
  }): Promise<{ batch: InventoryItemQuant }> {
    const quant = await this.repository.findById(params.batchId);
    if (!quant) throw new NotFoundException('Batch not found.');

    const tracking = await this.repository.findItemTracking(quant.inventoryItemId);

    const adjustParams: AdjustQuantParams =
      tracking === InventoryTrackingValues.SERIAL || tracking === InventoryTrackingValues.LOT_SERIAL
        ? { tracking, serials: params.serials ?? [] }
        : { tracking, delta: params.quantity };

    const updated = await this.database.runInTransaction(async () => {
      const { quant: u } = await this.adjustBatchScoped(params.batchId, adjustParams);
      return u;
    });

    this.logger.log(`Adjusted quant ${updated.id} by ${params.quantity} (${params.type})`);
    return { batch: updated };
  }

  // Adjusts a quant within a transaction (no ledger — caller handles it).
  //   'quantity' | 'lot':         delta-based adjustment; auto-deletes quant when quantity <= 0
  //   'serial' | 'lot_serial':    resolves serials → consumes those quant_items; auto-deletes at zero
  async adjustBatchScoped(
    batchId: string,
    params: AdjustQuantParams,
  ): Promise<{ quant: InventoryItemQuant; consumedItems: InventoryItemSerial[] }> {
    return this.database.runInTransaction(async () => {
      switch (params.tracking) {
        case 'quantity':
        case 'lot': {
          const quant = await this.repository.updateQuantity(batchId, String(params.delta));
          if (Number(quant.quantity) <= 0) await this.repository.deleteQuant(batchId);
          return { quant, consumedItems: [] };
        }
        case 'serial':
        case 'lot_serial': {
          const items = await this.repository.loadAvailableQuantItemsBySerials(batchId, params.serials);
          if (items.length !== params.serials.length) {
            throw new BadRequestException('Some serials are not AVAILABLE or do not belong to the given batch.');
          }
          await this.repository.consumeQuantItems(items.map((i) => i.id));
          const quant = await this.repository.updateQuantity(batchId, String(-items.length));
          if (Number(quant.quantity) <= 0) await this.repository.deleteQuant(batchId);
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
      businessUnitId: '',
      inventoryItemId: quant.inventoryItemId,
      lotNumber: quant.lotNumber,
      manufacturingDate: quant.manufacturingDate ?? null,
      expiryDate: quant.expiryDate ?? null,
      createdAt: quant.createdAt,
      updatedAt: quant.updatedAt,
    } as InventoryItemLot;
  }

  async reserve(batchId: string, quantity: number): Promise<InventoryItemQuant> {
    const batch = await this.repository.findById(batchId);
    if (!batch) throw new NotFoundException('Batch not found.');
    const available = Number(batch.quantity) - Number(batch.reservedQuantity);
    if (available < quantity) throw new BadRequestException('Insufficient available stock to reserve.');
    return this.repository.updateReservedQuantity(batchId, String(quantity));
  }

  async releaseReserve(batchId: string, quantity: number): Promise<InventoryItemQuant> {
    return this.repository.updateReservedQuantity(batchId, String(-quantity));
  }

  async findQuantsForTable(
    inventoryItemId: string,
    state: TableViewState,
  ): Promise<{ result: InventoryItemQuantDto[]; count: number }> {
    const filterWhere = FilterProcessor.buildWhere(state.filters, InventoryItemQuantsService.QUANTS_FIELD_MAP);
    const searchWhere = FilterProcessor.buildSearch(state.search, InventoryItemQuantsService.QUANTS_FIELD_MAP);
    const where = and(filterWhere, searchWhere) || undefined;
    const orderBy = FilterProcessor.buildOrderBy(state.sort, InventoryItemQuantsService.QUANTS_FIELD_MAP);
    const { limit = 20, offset = 0 } = state.pagination;

    const { result, count } = await this.repository.findQuantsForTable(inventoryItemId, {
      where,
      orderBy: orderBy.length > 0 ? orderBy : undefined,
      limit,
      offset,
    });

    return { result: result.map((row) => InventoryItemQuantDto.from(row, true)), count };
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
      dto.reorderLevel = row.reorderLevel !== null ? Number(row.reorderLevel) : null;
      return dto;
    });
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
