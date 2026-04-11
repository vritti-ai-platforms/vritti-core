import { Injectable, Logger } from '@nestjs/common';
import {
  BadRequestException,
  type FieldMap,
  type FilterCondition,
  FilterProcessor,
  NotFoundException,
  type SearchState,
  type SortCondition,
  type SuccessResponseDto,
} from '@vritti/api-sdk';
import { and, desc } from '@vritti/api-sdk/drizzle-orm';
import { type StockAdjustmentType, stockAdjustments, InventoryLedgerTypeValues } from '@/db/schema';
import { StockAdjustmentDto } from '../dto/entity/stock-adjustment.dto';
import type { CreateStockAdjustmentDto } from '@/modules/stock-adjustments/dto/request/create-stock-adjustment.dto';
import { StockAdjustmentsRepository } from '../repositories/stock-adjustments.repository';
import { InventoryItemBatchesService } from '@domain/inventory-item-batches/services/inventory-item-batches.service';

@Injectable()
export class StockAdjustmentsService {
  private readonly logger = new Logger(StockAdjustmentsService.name);

  private static readonly FIELD_MAP: FieldMap = {
    type: { column: stockAdjustments.type, type: 'string' },
  };

  constructor(
    private readonly repository: StockAdjustmentsRepository,
    private readonly batchesService: InventoryItemBatchesService,
  ) {}

  // Returns paginated stock adjustments for the data table
  async findForTable(params: {
    filters: FilterCondition[];
    sort: SortCondition[];
    search: SearchState | null;
    pagination: { limit: number; offset: number };
  }): Promise<{ result: StockAdjustmentDto[]; count: number }> {
    const filterWhere = FilterProcessor.buildWhere(params.filters, StockAdjustmentsService.FIELD_MAP);
    const searchWhere = FilterProcessor.buildSearch(params.search, StockAdjustmentsService.FIELD_MAP);
    const where = and(filterWhere, searchWhere);
    const orderBy = FilterProcessor.buildOrderBy(params.sort, StockAdjustmentsService.FIELD_MAP);

    const { result: rows, count } = await this.repository.findAllWithItemNames({
      where: where || undefined,
      orderBy: orderBy.length > 0 ? orderBy : [desc(stockAdjustments.createdAt)],
      limit: params.pagination.limit,
      offset: params.pagination.offset,
    });

    return { result: rows.map((r) => StockAdjustmentDto.from(r, r.inventoryItemName)), count };
  }

  // Generates a batch number from item code, location code, and dates
  private async generateBatchNumber(itemId: string, locationId: string, mfd?: string, exp?: string): Promise<string> {
    const { itemCode, locationCode } = await this.repository.findItemAndLocationCodes(itemId, locationId);
    const parts = [itemCode, locationCode];
    if (mfd) parts.push(`MFD${mfd.replace(/-/g, '')}`);
    if (exp) parts.push(`EXP${exp.replace(/-/g, '')}`);
    return parts.join('-');
  }

  // Creates a stock adjustment — OPENING_STOCK creates a new batch; all other types adjust an existing batch
  async create(data: CreateStockAdjustmentDto): Promise<StockAdjustmentDto> {
    if (data.type === 'OPENING_STOCK') {
      const batchNumber = await this.generateBatchNumber(
        data.inventoryItemId, data.locationId!, data.manufacturingDate, data.expiryDate,
      );

      const { batch } = await this.batchesService.createBatch({
        inventoryItemId: data.inventoryItemId,
        locationId: data.locationId!,
        quantity: data.quantity,
        batchNumber,
        manufacturingDate: data.manufacturingDate,
        expiryDate: data.expiryDate,
        type: InventoryLedgerTypeValues.OPENING_STOCK,
        referenceType: 'STOCK_ADJUSTMENT',
        notes: data.reason ?? undefined,
      });

      const entity = await this.repository.create({
        inventoryItemId: data.inventoryItemId,
        type: 'OPENING_STOCK' as StockAdjustmentType,
        quantity: String(data.quantity),
        batchId: batch.id,
        locationId: data.locationId ?? null,
        reason: data.reason ?? null,
        adjustedBy: data.adjustedBy ?? null,
      });

      this.logger.log(`Created OPENING_STOCK adjustment for item ${data.inventoryItemId} at location ${data.locationId}`);
      return StockAdjustmentDto.from(entity);
    }

    // CORRECTION can be positive or negative; negative types always deduct
    const isDeductType = ['WASTE', 'DAMAGE', 'THEFT', 'EXPIRED', 'PRODUCTION'].includes(data.type);
    const delta = isDeductType ? -Math.abs(data.quantity) : data.quantity;

    const { batch } = await this.batchesService.adjustBatch({
      batchId: data.batchId!,
      quantity: delta,
      type: InventoryLedgerTypeValues.ADJUSTMENT,
      referenceType: 'STOCK_ADJUSTMENT',
      notes: `${data.type}: ${data.reason ?? ''}`,
    });

    const entity = await this.repository.create({
      inventoryItemId: batch.inventoryItemId,
      type: data.type as StockAdjustmentType,
      quantity: String(delta),
      batchId: data.batchId ?? null,
      locationId: null,
      reason: data.reason ?? null,
      adjustedBy: data.adjustedBy ?? null,
    });

    this.logger.log(`Created ${data.type} adjustment for batch ${data.batchId} (delta: ${delta})`);
    return StockAdjustmentDto.from(entity);
  }

  // Deletes an OPENING_STOCK or CORRECTION adjustment and its associated batch
  async delete(id: string): Promise<SuccessResponseDto> {
    const adj = await this.repository.findById(id);
    if (!adj) throw new NotFoundException('Stock adjustment not found.');

    if (!['OPENING_STOCK', 'CORRECTION'].includes(adj.type)) {
      throw new BadRequestException('Only OPENING_STOCK and CORRECTION adjustments can be deleted.');
    }

    if (adj.batchId) {
      await this.batchesService.deleteBatch(adj.batchId);
    }

    await this.repository.deleteById(id);
    this.logger.log(`Deleted stock adjustment ${id} (${adj.type})`);
    return { success: true, message: 'Adjustment deleted.' };
  }
}
