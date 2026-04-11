import { Injectable, Logger } from '@nestjs/common';
import {
  BadRequestException,
  type FieldMap,
  type FilterCondition,
  FilterProcessor,
  NotFoundException,
  type SearchState,
  type SortCondition,
} from '@vritti/api-sdk';
import { and } from '@vritti/api-sdk/drizzle-orm';
import type { InventoryItemBatch, InventoryLedgerEntry, InventoryLedgerType } from '@/db/schema';
import { inventoryItemBatches, inventoryLedger, storageLocations } from '@/db/schema';
import { StockAdjustmentDto } from '@domain/stock-adjustments/dto/entity/stock-adjustment.dto';
import { InventoryItemBatchDto, InventoryLedgerDto, LocationStockDto } from '../dto/entity/inventory-item-batch.dto';
import { InventoryItemBatchesRepository } from '../repositories/inventory-item-batches.repository';

@Injectable()
export class InventoryItemBatchesService {
  private readonly logger = new Logger(InventoryItemBatchesService.name);

  private static readonly BATCHES_FIELD_MAP: FieldMap = {
    batchNumber: { column: inventoryItemBatches.batchNumber, type: 'string' },
    expiryDate: { column: inventoryItemBatches.expiryDate, type: 'string' },
    locationName: { column: storageLocations.name, type: 'string' },
  };

  private static readonly LEDGER_FIELD_MAP: FieldMap = {
    type: { column: inventoryLedger.type, type: 'string' },
    createdAt: { column: inventoryLedger.createdAt, type: 'string' },
    referenceType: { column: inventoryLedger.referenceType, type: 'string' },
  };

  constructor(private readonly repository: InventoryItemBatchesRepository) {}

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
  }): Promise<{ batch: InventoryItemBatch; ledgerEntry: InventoryLedgerEntry }> {
    const batch = await this.repository.create({
      inventoryItemId: params.inventoryItemId,
      locationId: params.locationId,
      quantity: String(params.quantity),
      batchNumber: params.batchNumber ?? null,
      manufacturingDate: params.manufacturingDate ?? null,
      expiryDate: params.expiryDate ?? null,
      goodsReceiptItemId: params.goodsReceiptItemId ?? null,
    });

    const ledgerEntry = await this.repository.createLedgerEntry({
      inventoryItemId: params.inventoryItemId,
      batchId: batch.id,
      type: params.type,
      quantity: String(params.quantity),
      referenceType: params.referenceType ?? null,
      referenceId: params.referenceId ?? null,
      notes: params.notes ?? null,
    });

    this.logger.log(`Created batch ${batch.id} for item ${params.inventoryItemId} (${params.type}, qty: ${params.quantity})`);
    return { batch, ledgerEntry };
  }

  // Adjusts an existing batch quantity (positive = add, negative = deduct)
  async adjustBatch(params: {
    batchId: string;
    quantity: number;
    type: InventoryLedgerType;
    referenceType?: string;
    referenceId?: string;
    notes?: string;
  }): Promise<{ batch: InventoryItemBatch; ledgerEntry: InventoryLedgerEntry }> {
    const batch = await this.repository.updateQuantity(params.batchId, String(params.quantity));

    const ledgerEntry = await this.repository.createLedgerEntry({
      inventoryItemId: batch.inventoryItemId,
      batchId: batch.id,
      type: params.type,
      quantity: String(params.quantity),
      referenceType: params.referenceType ?? null,
      referenceId: params.referenceId ?? null,
      notes: params.notes ?? null,
    });

    this.logger.log(`Adjusted batch ${batch.id} by ${params.quantity} (${params.type})`);
    return { batch, ledgerEntry };
  }

  // Reserves quantity on a batch; throws if insufficient available stock
  async reserve(batchId: string, quantity: number): Promise<InventoryItemBatch> {
    const batch = await this.repository.findById(batchId);
    if (!batch) throw new NotFoundException('Batch not found.');
    const available = Number(batch.quantity) - Number(batch.reservedQuantity);
    if (available < quantity) throw new BadRequestException('Insufficient available stock to reserve.');
    return this.repository.updateReservedQuantity(batchId, String(quantity));
  }

  // Releases a previously reserved quantity on a batch
  async releaseReserve(batchId: string, quantity: number): Promise<InventoryItemBatch> {
    return this.repository.updateReservedQuantity(batchId, String(-quantity));
  }

  // Returns paginated batches for an item with canDelete flag
  async findBatchesForTable(
    itemId: string,
    params: { filters: FilterCondition[]; sort: SortCondition[]; search: SearchState | null; pagination: { limit: number; offset: number } },
  ): Promise<{ result: InventoryItemBatchDto[]; count: number }> {
    const filterWhere = FilterProcessor.buildWhere(params.filters, InventoryItemBatchesService.BATCHES_FIELD_MAP);
    const searchWhere = FilterProcessor.buildSearch(params.search, InventoryItemBatchesService.BATCHES_FIELD_MAP);
    const where = and(filterWhere, searchWhere) || undefined;
    const orderBy = FilterProcessor.buildOrderBy(params.sort, InventoryItemBatchesService.BATCHES_FIELD_MAP);

    const { result, count } = await this.repository.findBatchesForTable(itemId, {
      where,
      orderBy: orderBy.length > 0 ? orderBy : undefined,
      limit: params.pagination.limit,
      offset: params.pagination.offset,
    });

    const dtos = await Promise.all(
      result.map(async (row) => {
        const canDelete = !(await this.repository.hasOtherLedgerEntries(row.id));
        return InventoryItemBatchDto.from(row, canDelete);
      }),
    );

    return { result: dtos, count };
  }

  // Returns a single batch by ID with canDelete flag
  async findBatchById(id: string): Promise<InventoryItemBatchDto> {
    const row = await this.repository.findById(id);
    if (!row) throw new NotFoundException('Batch not found.');
    const canDelete = !(await this.repository.hasOtherLedgerEntries(id));
    return InventoryItemBatchDto.from(row, canDelete);
  }

  // Deletes a batch if it has no non-OPENING_STOCK/CORRECTION ledger entries
  async deleteBatch(id: string): Promise<void> {
    const canDelete = !(await this.repository.hasOtherLedgerEntries(id));
    if (!canDelete) throw new BadRequestException('Cannot delete batch — stock has been used.');
    await this.repository.deleteBatch(id);
    this.logger.log(`Deleted batch ${id}`);
  }

  // Returns paginated ledger entries for a batch
  async findBatchLedger(
    batchId: string,
    params: { filters: FilterCondition[]; sort: SortCondition[]; search: SearchState | null; pagination: { limit: number; offset: number } },
  ): Promise<{ result: InventoryLedgerDto[]; count: number }> {
    const filterWhere = FilterProcessor.buildWhere(params.filters, InventoryItemBatchesService.LEDGER_FIELD_MAP);
    const searchWhere = FilterProcessor.buildSearch(params.search, InventoryItemBatchesService.LEDGER_FIELD_MAP);
    const where = and(filterWhere, searchWhere) || undefined;
    const orderBy = FilterProcessor.buildOrderBy(params.sort, InventoryItemBatchesService.LEDGER_FIELD_MAP);

    const { result, count } = await this.repository.findLedgerForTable(batchId, {
      where,
      orderBy: orderBy.length > 0 ? orderBy : undefined,
      limit: params.pagination.limit,
      offset: params.pagination.offset,
    });

    return { result: result.map(InventoryLedgerDto.from), count };
  }

  // Returns paginated stock adjustments linked to a batch
  async findBatchAdjustments(
    batchId: string,
    params: { filters: FilterCondition[]; sort: SortCondition[]; search: SearchState | null; pagination: { limit: number; offset: number } },
  ): Promise<{ result: StockAdjustmentDto[]; count: number }> {
    const { result, count } = await this.repository.findAdjustmentsForTable(batchId, {
      limit: params.pagination.limit,
      offset: params.pagination.offset,
    });

    return { result: result.map((r) => StockAdjustmentDto.from(r, r.inventoryItemName)), count };
  }

  // Returns location-wise stock aggregates for an item from the inventoryLevels view
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
