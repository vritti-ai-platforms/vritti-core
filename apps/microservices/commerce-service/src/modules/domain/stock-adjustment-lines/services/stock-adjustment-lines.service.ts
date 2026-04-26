import { StockAdjustmentLotsRepository } from '@domain/stock-adjustment-lots/repositories/stock-adjustment-lots.repository';
import { StockAdjustmentsRepository } from '@domain/stock-adjustments/repositories/stock-adjustments.repository';
import { Injectable, Logger } from '@nestjs/common';
import {
  BadRequestException,
  type CreateResponseDto,
  type FieldMap,
  FilterProcessor,
  NotFoundException,
  type SuccessResponseDto,
  type TableViewState,
  ValidationException,
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
import { StockAdjustmentLineDto } from '../dto/entity/stock-adjustment-line.dto';
import { StockAdjustmentLinesRepository } from '../repositories/stock-adjustment-lines.repository';

interface AdjustmentContext {
  id: string;
  code: string;
  status: StockAdjustmentStatus;
  type: StockAdjustmentType;
  inventoryItemId: string;
  inventoryItemTracking: 'quantity' | 'lot' | 'serial';
}

@Injectable()
export class StockAdjustmentLinesService {
  private readonly logger = new Logger(StockAdjustmentLinesService.name);

  private static readonly FIELD_MAP: FieldMap = {
    locationName: { column: storageLocations.name, type: 'string' },
    quantity: { column: stockAdjustmentLines.quantity, type: 'number' },
  };

  constructor(
    private readonly repository: StockAdjustmentLinesRepository,
    private readonly adjustmentsRepository: StockAdjustmentsRepository,
    private readonly lotsRepository: StockAdjustmentLotsRepository,
  ) {}

  async findForTable(
    adjustmentId: string,
    state: TableViewState,
    lotId?: string | null,
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
      lotId,
    });
    return { result: result.map(StockAdjustmentLineDto.from), count };
  }

  async findByAdjustmentId(adjustmentId: string): Promise<StockAdjustmentLineDto[]> {
    const rows = await this.repository.findByAdjustmentId(adjustmentId);
    return rows.map(StockAdjustmentLineDto.from);
  }

  async findByLotId(adjustmentId: string, lotId: string): Promise<StockAdjustmentLineDto[]> {
    // Verify lot belongs to adjustment
    const lot = await this.lotsRepository.findById(lotId);
    if (!lot || lot.stockAdjustmentId !== adjustmentId) {
      throw new NotFoundException('Stock adjustment lot not found.');
    }
    const rows = await this.repository.findByLotId(lotId);
    return rows.map(StockAdjustmentLineDto.from);
  }

  async findById(adjustmentId: string, lineId: string): Promise<StockAdjustmentLineDto> {
    const line = await this.repository.findByAdjustmentIdAndLineId(adjustmentId, lineId);
    if (!line) throw new NotFoundException('Stock adjustment line not found.');
    return StockAdjustmentLineDto.from(line);
  }

  async addLine(
    adjustment: AdjustmentContext,
    data: {
      createdById: string;
      stockAdjustmentLotId?: string | null;
      locationId?: string | null;
      quantId?: string | null;
      quantity: number;
    },
  ): Promise<StockAdjustmentLineDto> {
    if (adjustment.status !== StockAdjustmentStatusValues.DRAFT) {
      throw new BadRequestException('Lines can only be added to DRAFT adjustments.');
    }

    await this.validateIntent(adjustment, data);

    const isItemTracking = adjustment.inventoryItemTracking === 'serial';

    // For tracking='serial', quantity is derived from the serial count and starts at 0.
    // For 'quantity'/'lot' the user enters a quantity which must be non-zero.
    if (!Number.isFinite(data.quantity) || (data.quantity === 0 && !isItemTracking)) {
      throw new ValidationException({
        detail: 'Quantity must be a non-zero number.',
        errors: [{ field: 'quantity', message: 'Quantity is required.' }],
      });
    }

    const initialIsBalanced = isItemTracking ? data.quantity === 0 : true;

    const line = await this.repository.create({
      stockAdjustmentId: adjustment.id,
      createdById: data.createdById,
      stockAdjustmentLotId: data.stockAdjustmentLotId ?? null,
      locationId: data.locationId ?? null,
      quantId: data.quantId ?? null,
      quantity: String(data.quantity),
      isBalanced: initialIsBalanced,
    });

    this.logger.log(`Added line ${line.id} to adjustment ${adjustment.id}`);
    const refreshed = await this.repository.findByAdjustmentIdAndLineId(adjustment.id, line.id);
    if (!refreshed) throw new NotFoundException('Line not found after insert.');
    return StockAdjustmentLineDto.from(refreshed);
  }

  async addLineByAdjustmentId(
    adjustmentId: string,
    data: {
      createdById: string;
      stockAdjustmentLotId?: string | null;
      locationId?: string | null;
      quantId?: string | null;
      quantity: number;
    },
  ): Promise<CreateResponseDto<StockAdjustmentLineDto>> {
    const adjustment = await this.getAdjustmentContext(adjustmentId);
    const line = await this.addLine(adjustment, data);
    return {
      success: true,
      message: `Line added to adjustment "${adjustment.code}" successfully.`,
      data: line,
    };
  }

  async updateLine(
    adjustment: AdjustmentContext,
    lineId: string,
    data: {
      quantity?: number;
      stockAdjustmentLotId?: string | null;
      locationId?: string | null;
      quantId?: string | null;
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

    // Build the proposed shape and re-validate intent
    const next = {
      stockAdjustmentLotId:
        data.stockAdjustmentLotId !== undefined ? data.stockAdjustmentLotId : line.stockAdjustmentLotId,
      locationId: data.locationId !== undefined ? data.locationId : line.locationId,
      quantId: data.quantId !== undefined ? data.quantId : line.quantId,
      quantity: data.quantity !== undefined ? data.quantity : Number(line.quantity),
    };
    await this.validateIntent(adjustment, next);

    await this.repository.update(lineId, {
      ...(data.quantity !== undefined ? { quantity: String(data.quantity) } : {}),
      ...(data.stockAdjustmentLotId !== undefined ? { stockAdjustmentLotId: data.stockAdjustmentLotId } : {}),
      ...(data.locationId !== undefined ? { locationId: data.locationId } : {}),
      ...(data.quantId !== undefined ? { quantId: data.quantId } : {}),
    });

    await this.repository.refreshIsBalanced(lineId, adjustment.inventoryItemTracking);

    const refreshed = await this.repository.findByAdjustmentIdAndLineId(adjustment.id, lineId);
    if (!refreshed) throw new NotFoundException('Line not found after update.');
    return StockAdjustmentLineDto.from(refreshed);
  }

  async updateLineByAdjustmentId(
    adjustmentId: string,
    lineId: string,
    data: {
      quantity?: number;
      stockAdjustmentLotId?: string | null;
      locationId?: string | null;
      quantId?: string | null;
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
    return { success: true, message: `Line removed from adjustment "${adjustment.code}" successfully.` };
  }

  async refreshIsBalanced(adjustmentId: string, lineId: string): Promise<void> {
    const adjustment = await this.getAdjustmentContext(adjustmentId);
    await this.repository.refreshIsBalanced(lineId, adjustment.inventoryItemTracking);
  }

  // Used at publish time — return mismatched lines for tracking='serial' adjustments
  async getPublishValidation(adjustmentId: string): Promise<{ valid: boolean; invalidLinesCount: number }> {
    const adjustment = await this.getAdjustmentContext(adjustmentId);
    if (adjustment.inventoryItemTracking !== 'serial') return { valid: true, invalidLinesCount: 0 };
    const errors = await this.repository.findUnbalancedItemLines(adjustmentId);
    return { valid: errors.length === 0, invalidLinesCount: errors.length };
  }

  // Validates the line shape against (adjustment.type, item.tracking)
  private async validateIntent(
    adjustment: AdjustmentContext,
    data: {
      stockAdjustmentLotId?: string | null;
      locationId?: string | null;
      quantId?: string | null;
    },
  ): Promise<void> {
    const isOpening = adjustment.type === StockAdjustmentTypeValues.OPENING_STOCK;
    const tracking = adjustment.inventoryItemTracking;

    if (isOpening) {
      // Register intent: locationId required, quantId forbidden
      if (!data.locationId) {
        throw new ValidationException({
          detail: 'Storage location is required for OPENING_STOCK lines.',
          errors: [{ field: 'locationId', message: 'Storage location is required.' }],
        });
      }
      if (data.quantId) {
        throw new ValidationException({
          detail: 'quantId must not be set on OPENING_STOCK lines.',
          errors: [{ field: 'quantId', message: 'Not allowed on OPENING_STOCK.' }],
        });
      }
      // tracking=quantity: lot must NOT be set; tracking=lot/serial: lot must be set
      if (tracking === 'quantity') {
        if (data.stockAdjustmentLotId) {
          throw new ValidationException({
            detail: 'Lot must not be set for items with tracking=quantity.',
            errors: [{ field: 'stockAdjustmentLotId', message: 'Not allowed for tracking=quantity.' }],
          });
        }
      } else {
        if (!data.stockAdjustmentLotId) {
          throw new ValidationException({
            detail: 'A lot must be selected for OPENING_STOCK on lot/item-tracked items.',
            errors: [{ field: 'stockAdjustmentLotId', message: 'Lot is required.' }],
          });
        }
        // Verify the lot belongs to this adjustment
        const lot = await this.lotsRepository.findById(data.stockAdjustmentLotId);
        if (!lot || lot.stockAdjustmentId !== adjustment.id) {
          throw new ValidationException({
            detail: 'Lot does not belong to this adjustment.',
            errors: [{ field: 'stockAdjustmentLotId', message: 'Invalid lot reference.' }],
          });
        }
      }
    } else {
      // Change intent: quantId required, locationId/stockAdjustmentLotId forbidden
      if (!data.quantId) {
        throw new ValidationException({
          detail: 'A quant must be selected for deduct/correction lines.',
          errors: [{ field: 'quantId', message: 'Quant is required.' }],
        });
      }
      if (data.locationId) {
        throw new ValidationException({
          detail: 'locationId must not be set on deduct/correction lines.',
          errors: [{ field: 'locationId', message: 'Not allowed for deduct/correction.' }],
        });
      }
      if (data.stockAdjustmentLotId) {
        throw new ValidationException({
          detail: 'stockAdjustmentLotId must not be set on deduct/correction lines.',
          errors: [{ field: 'stockAdjustmentLotId', message: 'Not allowed for deduct/correction.' }],
        });
      }
    }
  }

  private async getAdjustmentContext(adjustmentId: string): Promise<AdjustmentContext> {
    const adjustment = await this.adjustmentsRepository.findByIdWithItemName(adjustmentId);
    if (!adjustment) throw new NotFoundException('Stock adjustment not found.');
    return adjustment;
  }
}
