import { InventoryItemLotsService } from '@domain/inventory-item-lots/services/inventory-item-lots.service';
import { InventoryLedgerService } from '@domain/inventory-ledger/services/inventory-ledger.service';
import { Injectable, Logger } from '@nestjs/common';
import {
  BadRequestException,
  type FieldMap,
  FilterProcessor,
  NotFoundException,
  type SelectOptionsQueryDto,
  type SelectQueryResult,
  type TableViewState,
} from '@vritti/api-sdk';
import { and, eq, ilike, or, type SQL } from '@vritti/api-sdk/drizzle-orm';
import {
  type InventoryItemLot,
  inventoryItemLots,
  type InventoryItemQuant,
  type InventoryItemQuantItem,
  inventoryItemQuants,
  type InventoryLedgerReferenceType,
  type InventoryLedgerType,
  type InventoryTracking,
  InventoryTrackingValues,
  locations,
} from '@/db/schema';
import { InventoryItemQuantDto, LocationStockDto } from '../dto/entity/inventory-item-quant.dto';
import { InventoryItemQuantsRepository } from '../repositories/inventory-item-quants.repository';

export type CreateQuantParams = {
  inventoryItemId: string;
  locationId: string;
  tracking: InventoryTracking;
  quantity: number;
  // for tracking='lot' or 'lot_serial': required
  lot?: { lotNumber: string; manufacturingDate?: string | null; expiryDate?: string | null };
  // for tracking='serial' or 'lot_serial': required, length must equal quantity
  serialNumbers?: string[];
};

export type AdjustQuantParams =
  | { tracking: 'quantity' | 'lot'; delta: number }
  | { tracking: 'serial' | 'lot_serial'; serials: string[] };

@Injectable()
export class InventoryItemQuantsService {
  private readonly logger = new Logger(InventoryItemQuantsService.name);

  private static readonly BATCHES_FIELD_MAP: FieldMap = {
    locationName: { column: locations.name, type: 'string' },
  };

  constructor(
    private readonly repository: InventoryItemQuantsRepository,
    private readonly ledgerService: InventoryLedgerService,
    private readonly lotsService: InventoryItemLotsService,
  ) {}

  // Creates a new quant in its own transaction and writes the ledger entry. Tracking-aware.
  // Caller may pass `lot` and `serialNumbers`; the wrapper drops them if the item is tracking='quantity'.
  async createBatch(params: {
    inventoryItemId: string;
    locationId: string;
    quantity: number;
    lot?: { lotNumber: string; manufacturingDate?: string | null; expiryDate?: string | null };
    serialNumbers?: string[];
    type: InventoryLedgerType;
    referenceType?: InventoryLedgerReferenceType;
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
        lot: params.lot,
        serialNumbers: params.serialNumbers,
      };
    }

    const { quant } = await this.createBatchScoped(createParams);
    await this.ledgerService.createEntry({
      inventoryItemId: params.inventoryItemId,
      batchId: quant.id,
      type: params.type,
      quantity: String(params.quantity),
      referenceType: params.referenceType ?? null,
      referenceId: params.referenceId ?? null,
      notes: params.notes ?? null,
    });

    this.logger.log(
      `Created quant ${quant.id} for item ${params.inventoryItemId} (${params.type}, qty: ${params.quantity})`,
    );
    return { batch: quant };
  }

  // Creates or upserts a quant within a transaction. Tracking-aware:
  //   'quantity':   lotId=null, upsert by (item, location)
  //   'lot':        resolves/creates lot, upsert by (item, location, lotId)
  //   'lot_serial': resolves/creates lot, upsert quant, then inserts N quant_items with serials
  //   'serial':     lotId=null, upsert quant by (item, location), then inserts N quant_items with serials
  // No ledger — caller handles it.
  async createBatchScoped(
    params: CreateQuantParams,
  ): Promise<{ quant: InventoryItemQuant; lot: InventoryItemLot | null; quantItems: InventoryItemQuantItem[] }> {
    this.validateCreateParams(params);

    let lot: InventoryItemLot | null = null;
    if (
      params.tracking === InventoryTrackingValues.LOT ||
      params.tracking === InventoryTrackingValues.LOT_SERIAL
    ) {
      if (!params.lot) throw new BadRequestException('lot is required for tracking=lot or lot_serial.');
      lot = await this.lotsService.findOrCreateLot({
        inventoryItemId: params.inventoryItemId,
        lotNumber: params.lot.lotNumber,
        manufacturingDate: params.lot.manufacturingDate ?? null,
        expiryDate: params.lot.expiryDate ?? null,
      });
    }

    const lotId = lot?.id ?? null;

    const existing = await this.repository.findByItemLocationLot(
      params.inventoryItemId,
      params.locationId,
      lotId,
    );

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

    let quantItems: InventoryItemQuantItem[] = [];
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

    return { quant, lot, quantItems };
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
    type: InventoryLedgerType;
    referenceType?: InventoryLedgerReferenceType;
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

    const { quant: updated } = await this.adjustBatchScoped(params.batchId, adjustParams);

    await this.ledgerService.createEntry({
      inventoryItemId: updated.inventoryItemId,
      batchId: updated.id,
      type: params.type,
      quantity: String(params.quantity),
      referenceType: params.referenceType ?? null,
      referenceId: params.referenceId ?? null,
      notes: params.notes ?? null,
    });

    this.logger.log(`Adjusted quant ${updated.id} by ${params.quantity} (${params.type})`);
    return { batch: updated };
  }

  // Adjusts a quant within a transaction (no ledger — caller handles it).
  //   'quantity' | 'lot':         delta-based adjustment of quant.quantity
  //   'serial' | 'lot_serial':    resolves serials → consumes those quant_items; quantity decremented by length
  async adjustBatchScoped(
    batchId: string,
    params: AdjustQuantParams,
  ): Promise<{ quant: InventoryItemQuant; consumedItems: InventoryItemQuantItem[] }> {
    switch (params.tracking) {
      case 'quantity':
      case 'lot': {
        const quant = await this.repository.updateQuantity(batchId, String(params.delta));
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
        return { quant, consumedItems: items };
      }
    }
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

  async findBatchesForTable(
    itemId: string,
    state: TableViewState,
  ): Promise<{ result: InventoryItemQuantDto[]; count: number }> {
    const filterWhere = FilterProcessor.buildWhere(state.filters, InventoryItemQuantsService.BATCHES_FIELD_MAP);
    const searchWhere = FilterProcessor.buildSearch(state.search, InventoryItemQuantsService.BATCHES_FIELD_MAP);
    const where = and(filterWhere, searchWhere) || undefined;
    const orderBy = FilterProcessor.buildOrderBy(state.sort, InventoryItemQuantsService.BATCHES_FIELD_MAP);
    const { limit = 20, offset = 0 } = state.pagination;

    const { result, count } = await this.repository.findBatchesForTable(itemId, {
      where,
      orderBy: orderBy.length > 0 ? orderBy : undefined,
      limit,
      offset,
    });

    const dtos = await Promise.all(
      result.map(async (row) => {
        const canDelete = !(await this.ledgerService.hasNonOpeningEntries(row.id));
        return InventoryItemQuantDto.from(row, canDelete);
      }),
    );

    return { result: dtos, count };
  }

  async findBatchById(id: string): Promise<InventoryItemQuantDto> {
    const row = await this.repository.findById(id);
    if (!row) throw new NotFoundException('Batch not found.');
    const canDelete = !(await this.ledgerService.hasNonOpeningEntries(id));
    return InventoryItemQuantDto.from(row, canDelete);
  }

  async deleteBatch(id: string): Promise<void> {
    const canDelete = !(await this.ledgerService.hasNonOpeningEntries(id));
    if (!canDelete) throw new BadRequestException('Cannot delete batch — stock has been used.');
    await this.repository.deleteBatch(id);
    this.logger.log(`Deleted batch ${id}`);
  }

  async findLocationStockByItemId(itemId: string): Promise<LocationStockDto[]> {
    const rows = await this.repository.findLocationStockByItemId(itemId);
    return rows.map((row) => {
      const dto = new LocationStockDto();
      dto.locationId = row.locationId;
      dto.locationName = row.locationName ?? null;
      dto.stockedQuantity = Number(row.stockedQuantity);
      dto.reservedQuantity = Number(row.reservedQuantity);
      dto.availableQuantity = Number(row.availableQuantity);
      dto.reorderLevel = row.reorderLevel !== null ? Number(row.reorderLevel) : null;
      return dto;
    });
  }

  async findForSelect(query: SelectOptionsQueryDto & { inventoryItemId: string }): Promise<SelectQueryResult> {
    if (!query.inventoryItemId) throw new BadRequestException('inventoryItemId is required.');
    const search = query.search?.trim();
    return this.repository.findForSelect({
      value: query.valueKey || 'id',
      label: query.labelKey || 'id',
      description: query.descriptionKey,
      additionalKeys: query.additionalKeys,
      values: query.values,
      excludeIds: query.excludeIds,
      limit: query.limit,
      offset: query.offset,
      orderByKey: query.orderByKey || 'createdAt',
      orderDirection: query.orderDirection || 'desc',
      where: { inventoryItemId: query.inventoryItemId },
      groupTable: query.groupIdKey === 'locationId' ? locations : undefined,
      groupIdKey: query.groupIdKey === 'locationId' ? 'id' : undefined,
      groupLabelKey: query.groupIdKey === 'locationId' ? 'name' : undefined,
      joins: [
        { table: locations, on: eq(inventoryItemQuants.locationId, locations.id), type: 'left' },
        { table: inventoryItemLots, on: eq(inventoryItemQuants.lotId, inventoryItemLots.id), type: 'left' },
      ],
      conditions: search
        ? [
            or(ilike(locations.name, `%${search}%`), ilike(inventoryItemLots.lotNumber, `%${search}%`)) as SQL,
          ]
        : undefined,
    });
  }
}
