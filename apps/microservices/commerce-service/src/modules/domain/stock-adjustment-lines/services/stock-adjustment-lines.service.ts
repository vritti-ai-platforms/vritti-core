import { StockAdjustmentLotsRepository } from '@domain/stock-adjustment-lots/repositories/stock-adjustment-lots.repository';
import { StockAdjustmentsRepository } from '@domain/stock-adjustments/repositories/stock-adjustments.repository';
import { Injectable, Logger } from '@nestjs/common';
import {
  BadRequestException,
  type FieldMap,
  FilterProcessor,
  NotFoundException,
  type SuccessResponseDto,
  type TableViewState,
  ValidationException,
} from '@vritti/api-sdk';
import { and } from '@vritti/api-sdk/drizzle-orm';
import {
  locations,
  type StockAdjustmentStatus,
  StockAdjustmentStatusValues,
  type StockAdjustmentType,
  stockAdjustmentLines,
} from '@/db/schema';
import { StockAdjustmentLineDto } from '../dto/entity/stock-adjustment-line.dto';
import { quantLocations, StockAdjustmentLinesRepository } from '../repositories/stock-adjustment-lines.repository';

interface AdjustmentContext {
  id: string;
  code: string;
  status: StockAdjustmentStatus;
  type: StockAdjustmentType;
  inventoryItemId: string;
  inventoryItemUomId: string;
  inventoryItemTracking: 'quantity' | 'lot' | 'serial' | 'lot_serial';
}

@Injectable()
export class StockAdjustmentLinesService {
  private readonly logger = new Logger(StockAdjustmentLinesService.name);

  private static readonly SEARCH_FIELD_MAP: FieldMap = {
    locationName: { column: locations.name, type: 'string' },
    locationPath: { column: locations.pathBreadcrumb, type: 'string' },
    quantLocationName: { column: quantLocations.name, type: 'string' },
  };

  private static readonly FILTER_FIELD_MAP: FieldMap = {
    quantity: { column: stockAdjustmentLines.quantity, type: 'number' },
    uomId: { column: stockAdjustmentLines.uomId, type: 'string' },
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
    const filterWhere = FilterProcessor.buildWhere(state.filters, StockAdjustmentLinesService.FILTER_FIELD_MAP);
    const searchWhere = FilterProcessor.buildSearch(state.search, StockAdjustmentLinesService.SEARCH_FIELD_MAP);
    const where = and(filterWhere, searchWhere);
    const { limit = 20, offset = 0 } = state.pagination;
    const { result, count } = await this.repository.findForTable(adjustmentId, {
      where,
      orderBy: FilterProcessor.buildOrderBy(state.sort, {
        ...StockAdjustmentLinesService.SEARCH_FIELD_MAP,
        ...StockAdjustmentLinesService.FILTER_FIELD_MAP,
      }),
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

  async findById(adjustmentId: string, lineId: string): Promise<StockAdjustmentLineDto> {
    const line = await this.repository.findByAdjustmentIdAndLineId(adjustmentId, lineId);
    if (!line) throw new NotFoundException('Stock adjustment line not found.');
    return StockAdjustmentLineDto.from(line);
  }

  async addOpeningLine(
    adjustment: AdjustmentContext,
    data: {
      locationId: string;
      stockAdjustmentLotId?: string | null;
      uomId: string;
      conversionFactor: number;
      quantity: number;
    },
  ): Promise<StockAdjustmentLineDto> {
    if (adjustment.status !== StockAdjustmentStatusValues.DRAFT) {
      throw new BadRequestException('Lines can only be added to DRAFT adjustments.');
    }

    await this.validateOpeningLineFields(adjustment.inventoryItemTracking, adjustment.id, data.stockAdjustmentLotId);

    const existing = await this.repository.findOneByLotLocationUom({
      adjustmentId: adjustment.id,
      stockAdjustmentLotId: data.stockAdjustmentLotId ?? null,
      locationId: data.locationId,
      uomId: data.uomId,
    });
    if (existing) {
      throw new ValidationException({
        detail: 'A line for this location and UOM already exists. Edit that line instead.',
        errors: [],
      });
    }

    if (data.quantity === 0) {
      throw new ValidationException({
        detail: 'Quantity must be a non-zero number.',
        errors: [{ field: 'quantity', message: 'Quantity is required.' }],
      });
    }

    const isItemTracking =
      adjustment.inventoryItemTracking === 'serial' || adjustment.inventoryItemTracking === 'lot_serial';
    const initialIsBalanced = !isItemTracking;

    const line = await this.repository.create({
      stockAdjustmentId: adjustment.id,
      stockAdjustmentLotId: data.stockAdjustmentLotId ?? null,
      locationId: data.locationId,
      quantId: null,
      uomId: data.uomId,
      conversionFactor: data.conversionFactor,
      quantity: data.quantity,
      isBalanced: initialIsBalanced,
    });

    this.logger.log(`Added opening line ${line.id} to adjustment ${adjustment.id}`);
    return StockAdjustmentLineDto.from(line);
  }

  async addChangeLine(
    adjustment: AdjustmentContext,
    data: {
      quantId: string;
      uomId: string;
      conversionFactor: number;
      quantity: number;
    },
  ): Promise<StockAdjustmentLineDto> {
    if (adjustment.status !== StockAdjustmentStatusValues.DRAFT) {
      throw new BadRequestException('Lines can only be added to DRAFT adjustments.');
    }

    if (data.quantity === 0) {
      throw new ValidationException({
        detail: 'Quantity must be a non-zero number.',
        errors: [{ field: 'quantity', message: 'Quantity is required.' }],
      });
    }

    const line = await this.repository.create({
      stockAdjustmentId: adjustment.id,
      stockAdjustmentLotId: null,
      locationId: null,
      quantId: data.quantId,
      uomId: data.uomId,
      conversionFactor: data.conversionFactor,
      quantity: data.quantity,
      isBalanced: true,
    });

    this.logger.log(`Added change line ${line.id} to adjustment ${adjustment.id}`);
    return StockAdjustmentLineDto.from(line);
  }

  async updateOpeningLine(
    adjustment: AdjustmentContext,
    lineId: string,
    data: {
      locationId?: string;
      stockAdjustmentLotId?: string | null;
      quantity?: number;
      uomId?: string;
      conversionFactor?: number;
    },
  ): Promise<void> {
    if (adjustment.status !== StockAdjustmentStatusValues.DRAFT) {
      throw new BadRequestException('Lines can only be updated on DRAFT adjustments.');
    }
    const line = await this.repository.findById(lineId);
    if (!line) throw new NotFoundException('Stock adjustment line not found.');
    if (line.stockAdjustmentId !== adjustment.id) {
      throw new BadRequestException('Line does not belong to this adjustment.');
    }

    const nextLotId = data.stockAdjustmentLotId !== undefined ? data.stockAdjustmentLotId : line.stockAdjustmentLotId;
    const nextLocationId = data.locationId ?? line.locationId;
    const nextUomId = data.uomId ?? line.uomId;

    await this.validateOpeningLineFields(adjustment.inventoryItemTracking, adjustment.id, nextLotId);

    if (nextLocationId) {
      const existing = await this.repository.findOneByLotLocationUom({
        adjustmentId: adjustment.id,
        stockAdjustmentLotId: nextLotId ?? null,
        locationId: nextLocationId,
        uomId: nextUomId,
      });
      if (existing && existing.id !== lineId) {
        throw new ValidationException({
          detail: 'A line for this location and UOM already exists. Edit that line instead.',
          errors: [],
        });
      }
    }

    await this.repository.transaction(async () => {
      await this.repository.update(lineId, {
        stockAdjustmentLotId: nextLotId,
        locationId: nextLocationId,
        uomId: nextUomId,
        quantity: data.quantity,
        conversionFactor: data.conversionFactor,
      });
      await this.repository.refreshIsBalanced(lineId, adjustment.inventoryItemTracking);
    });
  }

  async updateChangeLine(
    adjustment: AdjustmentContext,
    lineId: string,
    data: {
      quantId?: string;
      quantity?: number;
      uomId?: string;
      conversionFactor?: number;
    },
  ): Promise<void> {
    if (adjustment.status !== StockAdjustmentStatusValues.DRAFT) {
      throw new BadRequestException('Lines can only be updated on DRAFT adjustments.');
    }
    const line = await this.repository.findById(lineId);
    if (!line) throw new NotFoundException('Stock adjustment line not found.');
    if (line.stockAdjustmentId !== adjustment.id) {
      throw new BadRequestException('Line does not belong to this adjustment.');
    }

    await this.repository.transaction(async () => {
      await this.repository.update(lineId, {
        quantId: data.quantId,
        uomId: data.uomId,
        quantity: data.quantity,
        conversionFactor: data.conversionFactor,
      });
      await this.repository.refreshIsBalanced(lineId, adjustment.inventoryItemTracking);
    });
  }

  async removeLine(adjustment: AdjustmentContext, lineId: string): Promise<void> {
    if (adjustment.status !== StockAdjustmentStatusValues.DRAFT) {
      throw new BadRequestException('Lines can only be removed from DRAFT adjustments.');
    }
    const line = await this.repository.findById(lineId);
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

  // Used at publish time — return mismatched lines for serial-bearing adjustments
  async getPublishValidation(adjustmentId: string): Promise<{ valid: boolean; invalidLinesCount: number }> {
    const adjustment = await this.getAdjustmentContext(adjustmentId);
    if (adjustment.inventoryItemTracking !== 'serial' && adjustment.inventoryItemTracking !== 'lot_serial') {
      return { valid: true, invalidLinesCount: 0 };
    }
    const errors = await this.repository.findUnbalancedItemLines(adjustmentId);
    return { valid: errors.length === 0, invalidLinesCount: errors.length };
  }

  private async getAdjustmentContext(adjustmentId: string): Promise<AdjustmentContext> {
    const adjustment = await this.adjustmentsRepository.findByIdWithItemName(adjustmentId);
    if (!adjustment) throw new NotFoundException('Stock adjustment not found.');
    return adjustment;
  }

  private async validateOpeningLineFields(
    tracking: AdjustmentContext['inventoryItemTracking'],
    adjustmentId: string,
    stockAdjustmentLotId?: string | null,
  ): Promise<void> {
    if (tracking === 'quantity' || tracking === 'serial') {
      if (stockAdjustmentLotId) {
        throw new ValidationException({
          detail: `Lot must not be set for items with tracking=${tracking}.`,
          errors: [{ field: 'stockAdjustmentLotId', message: `Not allowed for tracking=${tracking}.` }],
        });
      }
    } else if (!stockAdjustmentLotId) {
      throw new ValidationException({
        detail: 'A lot must be selected for OPENING_STOCK on lot/lot_serial-tracked items.',
        errors: [{ field: 'stockAdjustmentLotId', message: 'Lot is required.' }],
      });
    } else {
      const lot = await this.lotsRepository.findById(stockAdjustmentLotId);
      if (!lot || lot.stockAdjustmentId !== adjustmentId) {
        throw new ValidationException({
          detail: 'Lot does not belong to this adjustment.',
          errors: [{ field: 'stockAdjustmentLotId', message: 'Invalid lot reference.' }],
        });
      }
    }
  }
}
