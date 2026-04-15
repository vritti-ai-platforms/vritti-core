import { InventoryItemBatchesService } from '@domain/inventory-item-batches/services/inventory-item-batches.service';
import { InventoryLedgerService } from '@domain/inventory-ledger/services/inventory-ledger.service';
import type { StockAdjustmentLineDto } from '@domain/stock-adjustment-lines/dto/entity/stock-adjustment-line.dto';
import { StockAdjustmentLinesRepository } from '@domain/stock-adjustment-lines/repositories/stock-adjustment-lines.repository';
import { StockAdjustmentLinesService } from '@domain/stock-adjustment-lines/services/stock-adjustment-lines.service';
import { Injectable, Logger } from '@nestjs/common';
import {
  BadRequestException,
  type CreateResponseDto,
  type FieldMap,
  FilterProcessor,
  NotFoundException,
  type SuccessResponseDto,
  type TableViewState,
} from '@vritti/api-sdk';
import { and } from '@vritti/api-sdk/drizzle-orm';
import {
  InventoryLedgerTypeValues,
  StockAdjustmentStatusValues,
  type StockAdjustmentType,
  StockAdjustmentTypeValues,
  stockAdjustments,
} from '@/db/schema';
import { StockAdjustmentDto } from '../dto/entity/stock-adjustment.dto';
import { StockAdjustmentsRepository } from '../repositories/stock-adjustments.repository';

@Injectable()
export class StockAdjustmentsService {
  private readonly logger = new Logger(StockAdjustmentsService.name);

  private static readonly FIELD_MAP: FieldMap = {
    type: { column: stockAdjustments.type, type: 'string' },
    status: { column: stockAdjustments.status, type: 'string' },
  };

  constructor(
    private readonly repository: StockAdjustmentsRepository,
    private readonly linesService: StockAdjustmentLinesService,
    private readonly linesRepository: StockAdjustmentLinesRepository,
    private readonly batchesService: InventoryItemBatchesService,
    private readonly ledgerService: InventoryLedgerService,
  ) {}

  // Returns paginated stock adjustments for the data table
  async findForTable(state: TableViewState): Promise<{ result: StockAdjustmentDto[]; count: number }> {
    const filterWhere = FilterProcessor.buildWhere(state.filters, StockAdjustmentsService.FIELD_MAP);
    const searchWhere = FilterProcessor.buildSearch(state.search, StockAdjustmentsService.FIELD_MAP);
    const where = and(filterWhere, searchWhere);
    const { limit = 20, offset = 0 } = state.pagination;

    const { result: rows, count } = await this.repository.findAllForTable({
      where: where || undefined,
      orderBy: FilterProcessor.buildOrderBy(state.sort, StockAdjustmentsService.FIELD_MAP),
      limit,
      offset,
    });

    return { result: rows.map((r) => StockAdjustmentDto.from(r)), count };
  }

  // Returns a single stock adjustment by ID with item name
  async findById(id: string): Promise<StockAdjustmentDto> {
    const adjustment = await this.repository.findByIdWithItemName(id);
    if (!adjustment) throw new NotFoundException('Stock adjustment not found.');
    return StockAdjustmentDto.from(adjustment);
  }

  // Creates a new DRAFT stock adjustment with an auto-generated code
  async create(data: {
    inventoryItemId: string;
    type: StockAdjustmentType;
    reason: string;
    createdById: string;
  }): Promise<CreateResponseDto<StockAdjustmentDto>> {
    const entity = await this.repository.create({
      inventoryItemId: data.inventoryItemId,
      type: data.type,
      reason: data.reason,
      createdById: data.createdById,
    });

    this.logger.log(`Created DRAFT adjustment ${entity.code} (${data.type}) for item ${data.inventoryItemId}`);
    return {
      success: true,
      message: `Stock adjustment "${entity.code}" created successfully.`,
      data: StockAdjustmentDto.from(entity),
    };
  }

  // Publishes a DRAFT adjustment — atomically creates/adjusts batches and writes ledger entries
  async publish(id: string): Promise<StockAdjustmentDto> {
    const adjustment = await this.repository.findByIdWithItemName(id);
    if (!adjustment) throw new NotFoundException('Stock adjustment not found.');
    if (adjustment.status !== StockAdjustmentStatusValues.DRAFT) {
      throw new BadRequestException('Only DRAFT adjustments can be published.');
    }

    const lines = await this.linesRepository.findByAdjustmentId(id);
    if (lines.length === 0) {
      throw new BadRequestException('Cannot publish an adjustment with no lines.');
    }

    const isDeductType = (t: StockAdjustmentType): boolean =>
      (
        [
          StockAdjustmentTypeValues.WASTE,
          StockAdjustmentTypeValues.DAMAGE,
          StockAdjustmentTypeValues.THEFT,
          StockAdjustmentTypeValues.EXPIRED,
          StockAdjustmentTypeValues.PRODUCTION,
        ] as readonly StockAdjustmentType[]
      ).includes(t);

    await this.repository.transaction(async (tx) => {
      for (const line of lines) {
        if (adjustment.type === StockAdjustmentTypeValues.OPENING_STOCK) {
          const batchNumber = await this.generateBatchNumber(
            adjustment.inventoryItemId,
            line.manufacturingDate ?? undefined,
          );

          const batch = await this.batchesService.createBatchInTx(tx, {
            inventoryItemId: adjustment.inventoryItemId,
            locationId: line.locationId!,
            quantity: Number(line.quantity),
            batchNumber,
            manufacturingDate: line.manufacturingDate ?? undefined,
            expiryDate: line.expiryDate ?? undefined,
          });

          await this.ledgerService.createEntryInTx(tx, {
            inventoryItemId: adjustment.inventoryItemId,
            batchId: batch.id,
            type: InventoryLedgerTypeValues.OPENING_STOCK,
            quantity: line.quantity,
            referenceType: 'STOCK_ADJUSTMENT',
            referenceId: id,
            notes: adjustment.reason ?? null,
          });

          await this.linesRepository.updateLineWithBatchInTx(tx, line.id, batch.id, batchNumber);
        } else {
          const delta = isDeductType(adjustment.type) ? -Math.abs(Number(line.quantity)) : Number(line.quantity);

          await this.batchesService.adjustBatchInTx(tx, line.batchId!, delta);

          await this.ledgerService.createEntryInTx(tx, {
            inventoryItemId: adjustment.inventoryItemId,
            batchId: line.batchId!,
            type: InventoryLedgerTypeValues.ADJUSTMENT,
            quantity: String(delta),
            referenceType: 'STOCK_ADJUSTMENT',
            referenceId: id,
            notes: `${adjustment.type}: ${adjustment.reason ?? ''}`,
          });
        }
      }

      await this.repository.updateStatusInTx(tx, id, StockAdjustmentStatusValues.PUBLISHED, new Date());
    });

    this.logger.log(`Published adjustment ${id} (${adjustment.type}, ${lines.length} lines)`);
    return this.findById(id);
  }

  // Deletes a DRAFT adjustment and all its lines (CASCADE)
  async delete(id: string): Promise<SuccessResponseDto> {
    const adjustment = await this.repository.findById(id);
    if (!adjustment) throw new NotFoundException('Stock adjustment not found.');
    if (adjustment.status !== StockAdjustmentStatusValues.DRAFT) {
      throw new BadRequestException('Only DRAFT adjustments can be deleted.');
    }

    await this.repository.deleteById(id);
    this.logger.log(`Deleted DRAFT adjustment ${adjustment.code} (${id})`);
    return { success: true, message: `Stock adjustment "${adjustment.code}" deleted successfully.` };
  }

  // Returns paginated lines for an adjustment
  async findLinesForTable(
    adjustmentId: string,
    state: TableViewState,
  ): Promise<{ result: StockAdjustmentLineDto[]; count: number }> {
    return this.linesService.findForTable(adjustmentId, state);
  }

  // Adds a line to a DRAFT adjustment
  async addLine(
    adjustmentId: string,
    data: { batchId?: string; locationId?: string; quantity: number; manufacturingDate?: string; expiryDate?: string },
  ): Promise<StockAdjustmentLineDto> {
    const adjustment = await this.repository.findByIdWithItemName(adjustmentId);
    if (!adjustment) throw new NotFoundException('Stock adjustment not found.');
    return this.linesService.addLine(adjustment, data);
  }

  // Updates a line on a DRAFT adjustment
  async updateLine(
    adjustmentId: string,
    lineId: string,
    data: { quantity?: number; locationId?: string; manufacturingDate?: string; expiryDate?: string },
  ): Promise<StockAdjustmentLineDto> {
    const adjustment = await this.repository.findByIdWithItemName(adjustmentId);
    if (!adjustment) throw new NotFoundException('Stock adjustment not found.');
    return this.linesService.updateLine(adjustment, lineId, data);
  }

  // Removes a line from a DRAFT adjustment
  async removeLine(adjustmentId: string, lineId: string): Promise<SuccessResponseDto> {
    const adjustment = await this.repository.findByIdWithItemName(adjustmentId);
    if (!adjustment) throw new NotFoundException('Stock adjustment not found.');
    await this.linesService.removeLine(adjustment, lineId);
    return { success: true, message: `Line "${lineId}" removed from adjustment "${adjustment.code}".` };
  }

  // Generates a batch number: {ITEM_CODE}-{YYMMDD}-{NNNN} (org-scoped sequence per item per day)
  private async generateBatchNumber(itemId: string, mfd?: string): Promise<string> {
    const itemCode = await this.repository.findItemCode(itemId);
    const date = mfd ?? new Date().toISOString().slice(0, 10);
    const dateCompact = date.replace(/-/g, '').slice(2);
    const count = await this.repository.countBatchesForItemOnDate(itemId, date);
    return `${itemCode}-${dateCompact}-${String(count + 1).padStart(4, '0')}`;
  }
}
