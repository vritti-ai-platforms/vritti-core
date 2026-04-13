import { InventoryLedgerService } from '@domain/inventory-ledger/services/inventory-ledger.service';
import { Injectable, Logger } from '@nestjs/common';
import {
  BadRequestException,
  type FieldMap,
  FilterProcessor,
  NotFoundException,
  type TableViewState,
  type TypedDrizzleClient,
} from '@vritti/api-sdk';
import { and } from '@vritti/api-sdk/drizzle-orm';
import type { InventoryItemBatch, InventoryLedgerType } from '@/db/schema';
import { inventoryItemBatches, storageLocations } from '@/db/schema';
import { InventoryItemBatchDto, LocationStockDto } from '../dto/entity/inventory-item-batch.dto';
import { InventoryItemBatchesRepository } from '../repositories/inventory-item-batches.repository';

@Injectable()
export class InventoryItemBatchesService {
  private readonly logger = new Logger(InventoryItemBatchesService.name);

  private static readonly BATCHES_FIELD_MAP: FieldMap = {
    batchNumber: { column: inventoryItemBatches.batchNumber, type: 'string' },
    expiryDate: { column: inventoryItemBatches.expiryDate, type: 'string' },
    locationName: { column: storageLocations.name, type: 'string' },
  };

  constructor(
    private readonly repository: InventoryItemBatchesRepository,
    private readonly ledgerService: InventoryLedgerService,
  ) {}

  // Creates a new batch and writes the opening ledger entry
  async createBatch(params: {
    inventoryItemId: string;
    locationId: string;
    quantity: number;
    batchNumber?: string;
    manufacturingDate?: string;
    expiryDate?: string;
    goodsReceiptItemId?: string;
    type: InventoryLedgerType;
    referenceType?: string;
    referenceId?: string;
    notes?: string;
  }): Promise<{ batch: InventoryItemBatch }> {
    const batch = await this.repository.create({
      inventoryItemId: params.inventoryItemId,
      locationId: params.locationId,
      quantity: String(params.quantity),
      batchNumber: params.batchNumber ?? null,
      manufacturingDate: params.manufacturingDate ?? null,
      expiryDate: params.expiryDate ?? null,
      goodsReceiptItemId: params.goodsReceiptItemId ?? null,
    });

    await this.ledgerService.createEntry({
      inventoryItemId: params.inventoryItemId,
      batchId: batch.id,
      type: params.type,
      quantity: String(params.quantity),
      referenceType: params.referenceType ?? null,
      referenceId: params.referenceId ?? null,
      notes: params.notes ?? null,
    });

    this.logger.log(
      `Created batch ${batch.id} for item ${params.inventoryItemId} (${params.type}, qty: ${params.quantity})`,
    );
    return { batch };
  }

  // Creates a new batch within a transaction (no ledger — caller handles it)
  async createBatchInTx(
    tx: TypedDrizzleClient,
    params: {
      inventoryItemId: string;
      locationId: string;
      quantity: number;
      batchNumber?: string;
      manufacturingDate?: string;
      expiryDate?: string;
    },
  ): Promise<InventoryItemBatch> {
    return this.repository.createWithTx(tx, {
      inventoryItemId: params.inventoryItemId,
      locationId: params.locationId,
      quantity: String(params.quantity),
      batchNumber: params.batchNumber ?? null,
      manufacturingDate: params.manufacturingDate ?? null,
      expiryDate: params.expiryDate ?? null,
    });
  }

  // Adjusts an existing batch quantity and writes a ledger entry
  async adjustBatch(params: {
    batchId: string;
    quantity: number;
    type: InventoryLedgerType;
    referenceType?: string;
    referenceId?: string;
    notes?: string;
  }): Promise<{ batch: InventoryItemBatch }> {
    const batch = await this.repository.updateQuantity(params.batchId, String(params.quantity));

    await this.ledgerService.createEntry({
      inventoryItemId: batch.inventoryItemId,
      batchId: batch.id,
      type: params.type,
      quantity: String(params.quantity),
      referenceType: params.referenceType ?? null,
      referenceId: params.referenceId ?? null,
      notes: params.notes ?? null,
    });

    this.logger.log(`Adjusted batch ${batch.id} by ${params.quantity} (${params.type})`);
    return { batch };
  }

  // Adjusts batch quantity within a transaction (no ledger — caller handles it)
  async adjustBatchInTx(tx: TypedDrizzleClient, batchId: string, delta: number): Promise<InventoryItemBatch> {
    return this.repository.updateQuantityWithTx(tx, batchId, String(delta));
  }

  async reserve(batchId: string, quantity: number): Promise<InventoryItemBatch> {
    const batch = await this.repository.findById(batchId);
    if (!batch) throw new NotFoundException('Batch not found.');
    const available = Number(batch.quantity) - Number(batch.reservedQuantity);
    if (available < quantity) throw new BadRequestException('Insufficient available stock to reserve.');
    return this.repository.updateReservedQuantity(batchId, String(quantity));
  }

  async releaseReserve(batchId: string, quantity: number): Promise<InventoryItemBatch> {
    return this.repository.updateReservedQuantity(batchId, String(-quantity));
  }

  async findBatchesForTable(
    itemId: string,
    state: TableViewState,
  ): Promise<{ result: InventoryItemBatchDto[]; count: number }> {
    const filterWhere = FilterProcessor.buildWhere(state.filters, InventoryItemBatchesService.BATCHES_FIELD_MAP);
    const searchWhere = FilterProcessor.buildSearch(state.search ?? null, InventoryItemBatchesService.BATCHES_FIELD_MAP);
    const where = and(filterWhere, searchWhere) || undefined;
    const orderBy = FilterProcessor.buildOrderBy(state.sort, InventoryItemBatchesService.BATCHES_FIELD_MAP);
    const { limit = 20, offset = 0 } = state.pagination ?? {};

    const { result, count } = await this.repository.findBatchesForTable(itemId, {
      where,
      orderBy: orderBy.length > 0 ? orderBy : undefined,
      limit,
      offset,
    });

    const dtos = await Promise.all(
      result.map(async (row) => {
        const canDelete = !(await this.ledgerService.hasNonOpeningEntries(row.id));
        return InventoryItemBatchDto.from(row, canDelete);
      }),
    );

    return { result: dtos, count };
  }

  async findBatchById(id: string): Promise<InventoryItemBatchDto> {
    const row = await this.repository.findById(id);
    if (!row) throw new NotFoundException('Batch not found.');
    const canDelete = !(await this.ledgerService.hasNonOpeningEntries(id));
    return InventoryItemBatchDto.from(row, canDelete);
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
}
