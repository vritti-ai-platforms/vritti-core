import { Injectable, Logger } from '@nestjs/common';
import { type FieldMap, FilterProcessor, type TableViewState } from '@vritti/api-sdk/database';
import { and } from '@vritti/api-sdk/drizzle-orm';
import {
  BadRequestException,
  ConflictException,
  NotFoundException,
  ValidationException,
} from '@vritti/api-sdk/exceptions';
import {
  type InventoryTracking,
  InventoryTrackingValues,
  locations,
  type StockAdjustmentStatus,
  StockAdjustmentStatusValues,
  type StockAdjustmentType,
  stockAdjustmentLines,
} from '@/db/schema';
import { StockAdjustmentLineDto } from '../dto/entity/stock-adjustment-line.dto';
import {
  quantLocations,
  StockAdjustmentLinesDomainRepository,
} from '../repositories/stock-adjustment-lines.repository';

interface AdjustmentContext {
  id: string;
  code: string;
  status: StockAdjustmentStatus;
  type: StockAdjustmentType;
  inventoryItemId: string;
  inventoryItemUomId: string;
  inventoryItemTracking: InventoryTracking;
}

@Injectable()
export class StockAdjustmentLinesDomainService {
  private readonly logger = new Logger(StockAdjustmentLinesDomainService.name);

  private static readonly SEARCH_FIELD_MAP: FieldMap = {
    locationName: { column: locations.name, type: 'string' },
    locationPath: { column: locations.pathBreadcrumb, type: 'string' },
    quantLocationName: { column: quantLocations.name, type: 'string' },
  };

  private static readonly FILTER_FIELD_MAP: FieldMap = {
    uomQty: { column: stockAdjustmentLines.uomQty, type: 'number' },
    uomId: { column: stockAdjustmentLines.uomId, type: 'string' },
  };

  constructor(private readonly repository: StockAdjustmentLinesDomainRepository) {}

  async findForTable(
    adjustmentId: string,
    state: TableViewState,
    lotId?: string | null,
  ): Promise<{ result: StockAdjustmentLineDto[]; count: number }> {
    const filterWhere = FilterProcessor.buildWhere(state.filters, StockAdjustmentLinesDomainService.FILTER_FIELD_MAP);
    const searchWhere = FilterProcessor.buildSearch(state.search, StockAdjustmentLinesDomainService.SEARCH_FIELD_MAP);
    const where = and(filterWhere, searchWhere);
    const { limit = 20, offset = 0 } = state.pagination;
    const { result, count } = await this.repository.findForTable(adjustmentId, {
      where,
      orderBy: FilterProcessor.buildOrderBy(state.sort, {
        ...StockAdjustmentLinesDomainService.SEARCH_FIELD_MAP,
        ...StockAdjustmentLinesDomainService.FILTER_FIELD_MAP,
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
      uomQty: number;
      primaryUomQty: number;
    },
  ): Promise<StockAdjustmentLineDto> {
    const t0 = Date.now();

    if (adjustment.status !== StockAdjustmentStatusValues.DRAFT) {
      throw new BadRequestException('Lines can only be added to DRAFT adjustments.');
    }

    await this.validateOpeningLineFields(adjustment.inventoryItemTracking, adjustment.id, data.stockAdjustmentLotId);
    this.logger.log(`addOpeningLine [validateOpeningLineFields] ${Date.now() - t0}ms`);

    const existing = await this.repository.findOneByLotLocationUom({
      adjustmentId: adjustment.id,
      stockAdjustmentLotId: data.stockAdjustmentLotId ?? null,
      locationId: data.locationId,
      uomId: data.uomId,
    });
    this.logger.log(`addOpeningLine [findOneByLotLocationUom] ${Date.now() - t0}ms`);
    if (existing) {
      throw new ValidationException({
        label: 'Duplicate Line',
        detail: 'A line for this location and UOM already exists. Edit that line instead.',
        errors: [],
      });
    }

    if (data.uomQty === 0) {
      throw new ValidationException({
        detail: 'Quantity must be a non-zero number.',
        errors: [{ field: 'uomQty', message: 'Quantity is required.' }],
      });
    }

    const isItemTracking =
      adjustment.inventoryItemTracking === InventoryTrackingValues.SERIAL ||
      adjustment.inventoryItemTracking === InventoryTrackingValues.LOT_SERIAL;
    const initialIsBalanced = !isItemTracking;

    const line = await this.repository.create({
      stockAdjustmentId: adjustment.id,
      stockAdjustmentLotId: data.stockAdjustmentLotId ?? null,
      locationId: data.locationId,
      quantId: null,
      uomId: data.uomId,
      uomQty: data.uomQty,
      primaryUomQty: data.primaryUomQty,
      isBalanced: initialIsBalanced,
    });
    this.logger.log(`addOpeningLine [repository.create] ${Date.now() - t0}ms`);

    this.logger.log(`Added opening line ${line.id} to adjustment ${adjustment.id}`);
    return StockAdjustmentLineDto.from(line);
  }

  async addChangeLine(
    adjustment: AdjustmentContext,
    data: {
      quantId: string;
      uomId: string;
      uomQty: number;
      primaryUomQty: number;
    },
  ): Promise<StockAdjustmentLineDto> {
    if (adjustment.status !== StockAdjustmentStatusValues.DRAFT) {
      throw new BadRequestException('Lines can only be added to DRAFT adjustments.');
    }

    if (data.uomQty === 0) {
      throw new ValidationException({
        detail: 'Quantity must be a non-zero number.',
        errors: [{ field: 'uomQty', message: 'Quantity is required.' }],
      });
    }

    const existing = await this.repository.findByAdjustmentIdAndQuantId(adjustment.id, data.quantId);
    if (existing) {
      throw new ConflictException({
        label: 'Duplicate Quant',
        detail: 'A line for this quant already exists on the adjustment.',
        errors: [{ field: 'quantId', message: 'Quant already added.' }],
      });
    }

    const isItemTracking =
      adjustment.inventoryItemTracking === InventoryTrackingValues.SERIAL ||
      adjustment.inventoryItemTracking === InventoryTrackingValues.LOT_SERIAL;

    const line = await this.repository.create({
      stockAdjustmentId: adjustment.id,
      stockAdjustmentLotId: null,
      locationId: null,
      quantId: data.quantId,
      uomId: data.uomId,
      uomQty: data.uomQty,
      primaryUomQty: data.primaryUomQty,
      isBalanced: !isItemTracking,
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
      uomQty?: number;
      uomId?: string;
      primaryUomQty?: number;
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
        uomQty: data.uomQty,
        primaryUomQty: data.primaryUomQty,
      });
      await this.repository.refreshIsBalanced(lineId, adjustment.inventoryItemTracking);
    });
  }

  async updateChangeLine(
    adjustment: AdjustmentContext,
    lineId: string,
    data: {
      quantId?: string;
      uomQty?: number;
      uomId?: string;
      primaryUomQty?: number;
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
        uomQty: data.uomQty,
        primaryUomQty: data.primaryUomQty,
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

  // Used at publish time — return mismatched lines for serial-bearing adjustments
  async getPublishValidation(adjustmentId: string): Promise<{ valid: boolean; invalidLinesCount: number }> {
    const errors = await this.repository.findUnbalancedItemLines(adjustmentId);
    return { valid: errors.length === 0, invalidLinesCount: errors.length };
  }

  // Validates lot constraint based purely on tracking type — app-layer verifies lot ownership separately
  private async validateOpeningLineFields(
    tracking: AdjustmentContext['inventoryItemTracking'],
    _adjustmentId: string,
    stockAdjustmentLotId?: string | null,
  ): Promise<void> {
    if (tracking === InventoryTrackingValues.QUANTITY || tracking === InventoryTrackingValues.SERIAL) {
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
    }
  }
}
