import { Injectable, Logger } from '@nestjs/common';
import {
  BadRequestException,
  type CreateResponseDto,
  type FieldMap,
  FilterProcessor,
  NotFoundException,
  type SuccessResponseDto,
  type TableViewState
} from '@vritti/api-sdk';
import { and } from '@vritti/api-sdk/drizzle-orm';
import { StockAdjustmentStatusValues, type StockAdjustmentType, stockAdjustments } from '@/db/schema';
import { StockAdjustmentDto } from '../dto/entity/stock-adjustment.dto';
import { StockAdjustmentsRepository } from '../repositories/stock-adjustments.repository';

@Injectable()
export class StockAdjustmentsService {
  private readonly logger = new Logger(StockAdjustmentsService.name);

  private static readonly FIELD_MAP: FieldMap = {
    type: { column: stockAdjustments.type, type: 'string' },
    status: { column: stockAdjustments.status, type: 'string' },
  };

  constructor(private readonly repository: StockAdjustmentsRepository) {}

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
      data: StockAdjustmentDto.fromEntity(entity),
    };
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

}
