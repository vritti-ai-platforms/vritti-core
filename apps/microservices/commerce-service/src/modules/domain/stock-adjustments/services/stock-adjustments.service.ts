import { Injectable, Logger } from '@nestjs/common';
import {
  type FieldMap,
  type FilterCondition,
  FilterProcessor,
  type SearchState,
  type SortCondition,
} from '@vritti/api-sdk';
import { and, desc } from '@vritti/api-sdk/drizzle-orm';
import { type StockAdjustmentType, stockAdjustments, InventoryLedgerTypeValues } from '@/db/schema';
import { StockAdjustmentDto } from '../dto/entity/stock-adjustment.dto';
import type { CreateStockAdjustmentDto } from '@/modules/stock-adjustments/dto/request/create-stock-adjustment.dto';
import { StockAdjustmentsRepository } from '../repositories/stock-adjustments.repository';
import { InventoryLevelsService } from '@domain/inventory-levels/services/inventory-levels.service';

@Injectable()
export class StockAdjustmentsService {
  private readonly logger = new Logger(StockAdjustmentsService.name);

  private static readonly FIELD_MAP: FieldMap = {
    type: { column: stockAdjustments.type, type: 'string' },
  };

  constructor(
    private readonly repository: StockAdjustmentsRepository,
    private readonly inventoryLevelsService: InventoryLevelsService,
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

  // Creates a stock adjustment and updates inventory level + ledger via InventoryLevelsService
  async create(data: CreateStockAdjustmentDto): Promise<StockAdjustmentDto> {
    const entity = await this.repository.create({
      inventoryItemId: data.inventoryItemId,
      type: data.type as StockAdjustmentType,
      quantity: String(data.quantity),
      reason: data.reason ?? null,
      adjustedBy: data.adjustedBy ?? null,
    });

    const notes = `${data.type} adjustment: ${data.reason ?? 'No reason provided'}`;

    // Use addStock for positive, deductStock for negative
    if (data.quantity >= 0) {
      await this.inventoryLevelsService.addStock({
        itemId: data.inventoryItemId,
        locationId: data.locationId,
        quantity: data.quantity,
        type: InventoryLedgerTypeValues.ADJUSTMENT,
        referenceType: 'STOCK_ADJUSTMENT',
        referenceId: entity.id,
        notes,
      });
    } else {
      await this.inventoryLevelsService.deductStock({
        itemId: data.inventoryItemId,
        locationId: data.locationId,
        quantity: Math.abs(data.quantity),
        type: InventoryLedgerTypeValues.ADJUSTMENT,
        referenceType: 'STOCK_ADJUSTMENT',
        referenceId: entity.id,
        notes,
      });
    }

    this.logger.log(`Created stock adjustment: ${entity.id} (${data.type}, qty: ${data.quantity})`);
    return StockAdjustmentDto.from(entity);
  }
}
