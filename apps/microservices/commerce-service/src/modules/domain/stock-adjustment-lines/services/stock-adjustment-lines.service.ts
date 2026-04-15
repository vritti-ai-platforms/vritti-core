import { StockAdjustmentsRepository } from '@domain/stock-adjustments/repositories/stock-adjustments.repository';
import { StockAdjustmentLineItemsRepository } from '@domain/stock-adjustment-line-items/repositories/stock-adjustment-line-items.repository';
import { Injectable, Logger } from '@nestjs/common';
import {
  BadRequestException,
  type FieldMap,
  FilterProcessor,
  NotFoundException,
  type SuccessResponseDto,
  type TableViewState,
} from '@vritti/api-sdk';
import { and } from '@vritti/api-sdk/drizzle-orm';
import {
  type StockAdjustmentStatus,
  StockAdjustmentStatusValues,
  type StockAdjustmentType,
  StockAdjustmentTypeValues,
  stockAdjustmentLines,
  storageLocations,
} from '@/db/schema';

interface AdjustmentContext {
  id: string;
  status: StockAdjustmentStatus;
  type: StockAdjustmentType;
}

import { StockAdjustmentLineDto } from '../dto/entity/stock-adjustment-line.dto';
import { StockAdjustmentLinesRepository } from '../repositories/stock-adjustment-lines.repository';

@Injectable()
export class StockAdjustmentLinesService {
  private readonly logger = new Logger(StockAdjustmentLinesService.name);

  private static readonly FIELD_MAP: FieldMap = {
    batchNumber: { column: stockAdjustmentLines.batchNumber, type: 'string' },
    locationName: { column: storageLocations.name, type: 'string' },
    quantity: { column: stockAdjustmentLines.quantity, type: 'number' },
  };

  constructor(
    private readonly repository: StockAdjustmentLinesRepository,
    private readonly adjustmentsRepository: StockAdjustmentsRepository,
    private readonly lineItemsRepository: StockAdjustmentLineItemsRepository,
  ) {}

  async findForTable(
    adjustmentId: string,
    state: TableViewState,
  ): Promise<{ result: StockAdjustmentLineDto[]; count: number }> {
    const filterWhere = FilterProcessor.buildWhere(state.filters, StockAdjustmentLinesService.FIELD_MAP);
    const searchWhere = FilterProcessor.buildSearch(state.search, StockAdjustmentLinesService.FIELD_MAP);
    const where = and(filterWhere, searchWhere);
    const { limit = 20, offset = 0 } = state.pagination;

    const { result, count } = await this.repository.findForTable(adjustmentId, {
      where,
      orderBy: FilterProcessor.buildOrderBy(state.sort, StockAdjustmentLinesService.FIELD_MAP),
      limit,
      offset,
    });

    const stats = await this.lineItemsRepository.findStatsByLineIds(result.map((line) => line.id));
    return {
      result: result.map((line) => {
        const lineStats = stats.get(line.id);
        const sum = Number(lineStats?.lineItemsQuantitySum ?? 0);
        const lineQty = Number(line.quantity);
        return StockAdjustmentLineDto.from({
          ...line,
          lineItemsCount: Number(lineStats?.lineItemsCount ?? 0),
          lineItemsQuantitySum: sum,
          lineItemsDelta: Number((lineQty - sum).toFixed(3)),
          isBalanced: line.isBalanced,
          isLineItemsBalanced: line.isBalanced,
        });
      }),
      count,
    };
  }

  async addLine(
    adjustment: AdjustmentContext,
    data: {
      createdById: string;
      batchId?: string;
      locationId?: string;
      quantity: number;
      manufacturingDate?: string;
      expiryDate?: string;
    },
  ): Promise<StockAdjustmentLineDto> {
    if (adjustment.status !== StockAdjustmentStatusValues.DRAFT) {
      throw new BadRequestException('Lines can only be added to DRAFT adjustments.');
    }

    this.validateLineForType(adjustment.type, data);

    const line = await this.repository.create({
      stockAdjustmentId: adjustment.id,
      createdById: data.createdById,
      batchId: data.batchId ?? null,
      locationId: data.locationId ?? null,
      quantity: String(data.quantity),
      isBalanced: false,
      manufacturingDate: data.manufacturingDate ?? null,
      expiryDate: data.expiryDate ?? null,
    });

    this.logger.log(`Added line ${line.id} to adjustment ${adjustment.id}`);
    return StockAdjustmentLineDto.from(line);
  }

  async addLineByAdjustmentId(
    adjustmentId: string,
    data: {
      createdById: string;
      batchId?: string;
      locationId?: string;
      quantity: number;
      manufacturingDate?: string;
      expiryDate?: string;
    },
  ): Promise<StockAdjustmentLineDto> {
    const adjustment = await this.getAdjustmentContext(adjustmentId);
    return this.addLine(adjustment, data);
  }

  async updateLine(
    adjustment: AdjustmentContext,
    lineId: string,
    data: {
      quantity?: number;
      locationId?: string;
      manufacturingDate?: string;
      expiryDate?: string;
    },
  ): Promise<StockAdjustmentLineDto> {
    if (adjustment.status !== StockAdjustmentStatusValues.DRAFT) {
      throw new BadRequestException('Lines can only be updated on DRAFT adjustments.');
    }

    const line = await this.repository.findLineById(lineId);
    if (!line) throw new NotFoundException('Stock adjustment line not found.');
    if (line.stockAdjustmentId !== adjustment.id) {
      throw new BadRequestException('Line does not belong to this adjustment.');
    }

    await this.repository.update(lineId, {
      ...(data.quantity !== undefined ? { quantity: String(data.quantity) } : {}),
      ...(data.locationId !== undefined ? { locationId: data.locationId } : {}),
      ...(data.manufacturingDate !== undefined ? { manufacturingDate: data.manufacturingDate } : {}),
      ...(data.expiryDate !== undefined ? { expiryDate: data.expiryDate } : {}),
    });
    await this.repository.refreshIsBalanced(lineId);
    const refreshed = await this.repository.findLineById(lineId);
    if (!refreshed) throw new NotFoundException('Stock adjustment line not found.');

    this.logger.log(`Updated line ${lineId} on adjustment ${adjustment.id}`);
    return StockAdjustmentLineDto.from(refreshed);
  }

  async updateLineByAdjustmentId(
    adjustmentId: string,
    lineId: string,
    data: {
      quantity?: number;
      locationId?: string;
      manufacturingDate?: string;
      expiryDate?: string;
    },
  ): Promise<StockAdjustmentLineDto> {
    const adjustment = await this.getAdjustmentContext(adjustmentId);
    return this.updateLine(adjustment, lineId, data);
  }

  async removeLine(adjustment: AdjustmentContext, lineId: string): Promise<void> {
    if (adjustment.status !== StockAdjustmentStatusValues.DRAFT) {
      throw new BadRequestException('Lines can only be removed from DRAFT adjustments.');
    }

    const line = await this.repository.findLineById(lineId);
    if (!line) throw new NotFoundException('Stock adjustment line not found.');
    if (line.stockAdjustmentId !== adjustment.id) {
      throw new BadRequestException('Line does not belong to this adjustment.');
    }

    await this.repository.deleteLine(lineId);
    this.logger.log(`Removed line ${lineId} from adjustment ${adjustment.id}`);
  }

  async removeLineByAdjustmentId(adjustmentId: string, lineId: string): Promise<SuccessResponseDto> {
    const adjustment = await this.getAdjustmentContext(adjustmentId);
    await this.removeLine(adjustment, lineId);
    return { success: true, message: `Line "${lineId}" removed from adjustment "${adjustment.id}".` };
  }

  async findByAdjustmentId(adjustmentId: string): Promise<StockAdjustmentLineDto[]> {
    const rows = await this.repository.findByAdjustmentId(adjustmentId);
    const stats = await this.lineItemsRepository.findStatsByLineIds(rows.map((line) => line.id));
    return rows.map((line) => {
      const lineStats = stats.get(line.id);
      const sum = Number(lineStats?.lineItemsQuantitySum ?? 0);
      const lineQty = Number(line.quantity);
      return StockAdjustmentLineDto.from({
        ...line,
        lineItemsCount: Number(lineStats?.lineItemsCount ?? 0),
        lineItemsQuantitySum: sum,
        lineItemsDelta: Number((lineQty - sum).toFixed(3)),
        isBalanced: line.isBalanced,
        isLineItemsBalanced: line.isBalanced,
      });
    });
  }

  async findById(adjustmentId: string, lineId: string): Promise<StockAdjustmentLineDto> {
    const line = await this.repository.findByAdjustmentIdAndLineId(adjustmentId, lineId);
    if (!line) throw new NotFoundException('Stock adjustment line not found.');

    const stats = await this.lineItemsRepository.findStatsByLineIds([line.id]);
    const lineStats = stats.get(line.id);
    const sum = Number(lineStats?.lineItemsQuantitySum ?? 0);
    const lineQty = Number(line.quantity);

    return StockAdjustmentLineDto.from({
      ...line,
      lineItemsCount: Number(lineStats?.lineItemsCount ?? 0),
      lineItemsQuantitySum: sum,
      lineItemsDelta: Number((lineQty - sum).toFixed(3)),
      isBalanced: line.isBalanced,
      isLineItemsBalanced: line.isBalanced,
    });
  }

  private validateLineForType(type: StockAdjustmentType, data: { batchId?: string; locationId?: string }): void {
    if (type === StockAdjustmentTypeValues.OPENING_STOCK) {
      if (!data.locationId) {
        throw new BadRequestException('Storage location is required for OPENING_STOCK lines.');
      }
    } else {
      if (!data.batchId) {
        throw new BadRequestException('Batch is required for non-OPENING_STOCK lines.');
      }
    }
  }

  private async getAdjustmentContext(adjustmentId: string): Promise<AdjustmentContext> {
    const adjustment = await this.adjustmentsRepository.findByIdWithItemName(adjustmentId);
    if (!adjustment) throw new NotFoundException('Stock adjustment not found.');
    return adjustment;
  }
}
