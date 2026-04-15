import { StockAdjustmentLinesRepository } from '@domain/stock-adjustment-lines/repositories/stock-adjustment-lines.repository';
import { StockAdjustmentsRepository } from '@domain/stock-adjustments/repositories/stock-adjustments.repository';
import { Injectable, NotFoundException } from '@nestjs/common';
import { BadRequestException, type FieldMap, FilterProcessor, type TableViewState } from '@vritti/api-sdk';
import { and } from '@vritti/api-sdk/drizzle-orm';
import { StockAdjustmentStatusValues, type StockAdjustmentType, stockAdjustmentLineItems } from '@/db/schema';
import { StockAdjustmentLineItemDto } from '../dto/entity/stock-adjustment-line-item.dto';
import { StockAdjustmentLineItemsRepository } from '../repositories/stock-adjustment-line-items.repository';

interface AdjustmentContext {
  id: string;
  status: string;
  type: StockAdjustmentType;
  inventoryItemId: string;
}

@Injectable()
export class StockAdjustmentLineItemsService {
  private static readonly FIELD_MAP: FieldMap = {
    quantity: { column: stockAdjustmentLineItems.quantity, type: 'number' },
  };

  constructor(
    private readonly repository: StockAdjustmentLineItemsRepository,
    private readonly linesRepository: StockAdjustmentLinesRepository,
    private readonly adjustmentsRepository: StockAdjustmentsRepository,
  ) {}

  async listByLine(adjustmentId: string, lineId: string): Promise<StockAdjustmentLineItemDto[]> {
    await this.ensureLineBelongsToAdjustment(adjustmentId, lineId);
    const rows = await this.repository.findByLineId(lineId);
    return rows.map(StockAdjustmentLineItemDto.from);
  }

  async findForTable(
    adjustmentId: string,
    lineId: string,
    state: TableViewState,
  ): Promise<{ result: StockAdjustmentLineItemDto[]; count: number }> {
    await this.ensureLineBelongsToAdjustment(adjustmentId, lineId);
    const filterWhere = FilterProcessor.buildWhere(state.filters, StockAdjustmentLineItemsService.FIELD_MAP);
    const searchWhere = FilterProcessor.buildSearch(state.search, StockAdjustmentLineItemsService.FIELD_MAP);
    const where = and(filterWhere, searchWhere);
    const { limit = 20, offset = 0 } = state.pagination;
    const { result, count } = await this.repository.findForTable(lineId, {
      where,
      orderBy: FilterProcessor.buildOrderBy(state.sort, StockAdjustmentLineItemsService.FIELD_MAP),
      limit,
      offset,
    });
    return { result: result.map(StockAdjustmentLineItemDto.from), count };
  }

  async addLineItem(
    adjustmentId: string,
    lineId: string,
    data: { quantity: number },
  ): Promise<StockAdjustmentLineItemDto> {
    const adjustment = await this.getAdjustmentContext(adjustmentId);
    if (adjustment.status !== StockAdjustmentStatusValues.DRAFT) {
      throw new BadRequestException('Line items can only be modified on DRAFT adjustments.');
    }

    await this.ensureLineBelongsToAdjustment(adjustmentId, lineId);

    const entity = await this.repository.create({
      stockAdjustmentLineId: lineId,
      inventoryItemId: adjustment.inventoryItemId,
      quantity: String(data.quantity),
    });
    await this.linesRepository.refreshIsBalanced(lineId);
    return StockAdjustmentLineItemDto.from(entity);
  }

  async updateLineItem(
    adjustmentId: string,
    lineId: string,
    itemId: string,
    data: { quantity: number },
  ): Promise<StockAdjustmentLineItemDto> {
    const adjustment = await this.getAdjustmentContext(adjustmentId);
    if (adjustment.status !== StockAdjustmentStatusValues.DRAFT) {
      throw new BadRequestException('Line items can only be modified on DRAFT adjustments.');
    }

    await this.ensureLineBelongsToAdjustment(adjustmentId, lineId);

    const existing = await this.repository.findById(itemId);
    if (!existing || existing.stockAdjustmentLineId !== lineId) {
      throw new NotFoundException('Stock adjustment line item not found.');
    }

    if (existing.inventoryItemId !== adjustment.inventoryItemId) {
      throw new BadRequestException('Line item inventory item must match parent adjustment inventory item.');
    }

    const updated = await this.repository.update(itemId, { quantity: String(data.quantity) });
    await this.linesRepository.refreshIsBalanced(lineId);
    return StockAdjustmentLineItemDto.from(updated);
  }

  async removeLineItem(adjustmentId: string, lineId: string, itemId: string): Promise<{ success: boolean; message: string }> {
    const adjustment = await this.getAdjustmentContext(adjustmentId);
    if (adjustment.status !== StockAdjustmentStatusValues.DRAFT) {
      throw new BadRequestException('Line items can only be modified on DRAFT adjustments.');
    }

    await this.ensureLineBelongsToAdjustment(adjustmentId, lineId);
    const existing = await this.repository.findById(itemId);
    if (!existing || existing.stockAdjustmentLineId !== lineId) {
      throw new NotFoundException('Stock adjustment line item not found.');
    }

    await this.repository.delete(itemId);
    await this.linesRepository.refreshIsBalanced(lineId);
    return { success: true, message: `Line item "${itemId}" removed successfully.` };
  }

  async getPublishValidation(adjustmentId: string): Promise<{
    valid: boolean;
    errors: { lineId: string; lineQuantity: number; lineItemsCount: number; lineItemsQuantitySum: number; delta: number }[];
  }> {
    const rows = await this.repository.findValidationRowsByAdjustmentId(adjustmentId);
    const errors = rows
      .map((row) => ({
        ...row,
        delta: Number((row.lineQuantity - row.lineItemsQuantitySum).toFixed(3)),
      }))
      .filter((row) => row.lineItemsCount < 1 || row.delta !== 0);

    return { valid: errors.length === 0, errors };
  }

  private async ensureLineBelongsToAdjustment(adjustmentId: string, lineId: string): Promise<void> {
    const line = await this.linesRepository.findLineById(lineId);
    if (!line || line.stockAdjustmentId !== adjustmentId) {
      throw new NotFoundException('Stock adjustment line not found.');
    }
  }

  private async getAdjustmentContext(adjustmentId: string): Promise<AdjustmentContext> {
    const adjustment = await this.adjustmentsRepository.findById(adjustmentId);
    if (!adjustment) throw new NotFoundException('Stock adjustment not found.');
    return adjustment;
  }
}
