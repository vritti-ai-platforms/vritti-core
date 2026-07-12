import { Injectable, Logger } from '@nestjs/common';
import {
  type CreateResponseDto,
  type FieldMap,
  FilterProcessor,
  type SuccessResponseDto,
  type TableViewState,
} from '@vritti/api-sdk/database';
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
  type StockAdjustmentStatus,
  StockAdjustmentStatusValues,
  stockAdjustmentLineItems,
} from '@/db/schema';
import { StockAdjustmentLineItemDto } from '../dto/entity/stock-adjustment-line-item.dto';
import { StockAdjustmentLineItemsRepository } from '../repositories/stock-adjustment-line-items.repository';

// Minimal adjustment shape needed by write methods — passed in from app-layer
interface AdjustmentContext {
  id: string;
  status: StockAdjustmentStatus;
  inventoryItemTracking: InventoryTracking;
}

@Injectable()
export class StockAdjustmentLineItemsService {
  private readonly logger = new Logger(StockAdjustmentLineItemsService.name);

  private static readonly FIELD_MAP: FieldMap = {
    serialNumber: { column: stockAdjustmentLineItems.serialNumber, type: 'string' },
  };

  constructor(private readonly repository: StockAdjustmentLineItemsRepository) {}

  async findForTable(
    lineId: string,
    state: TableViewState,
  ): Promise<{ result: StockAdjustmentLineItemDto[]; count: number }> {
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

  async countByLineId(lineId: string): Promise<number> {
    return this.repository.countByLineId(lineId);
  }

  // For tracking='serial' lines:
  //   - OPENING_STOCK: register a NEW serial — must not exist in inventory_item_serials for this item
  //   - Deduct types:  consume an EXISTING serial — must be AVAILABLE on the line's quant
  async addLineItem(
    adjustment: AdjustmentContext,
    lineId: string,
    data: { serialNumber: string },
  ): Promise<CreateResponseDto<StockAdjustmentLineItemDto>> {
    if (adjustment.status !== StockAdjustmentStatusValues.DRAFT) {
      throw new BadRequestException('Line items can only be modified on DRAFT adjustments.');
    }
    if (
      adjustment.inventoryItemTracking !== InventoryTrackingValues.SERIAL &&
      adjustment.inventoryItemTracking !== InventoryTrackingValues.LOT_SERIAL
    ) {
      throw new BadRequestException('Line items are only allowed on serial-tracked adjustments.');
    }

    const trimmed = data.serialNumber?.trim();
    if (!trimmed) {
      throw new ValidationException({
        label: 'Invalid Serial',
        detail: 'Serial number is required.',
        errors: [{ field: 'serialNumber', message: 'Serial number is required.' }],
      });
    }

    const dup = await this.repository.findBySerialOnAdjustment(adjustment.id, trimmed);
    if (dup) {
      const isSameLine = dup.stockAdjustmentLineId === lineId;
      throw new ConflictException({
        label: 'Duplicate Serial',
        detail: isSameLine
          ? `Serial "${trimmed}" already added to this line.`
          : `Serial "${trimmed}" is already used on another line of this adjustment.`,
        errors: [
          {
            field: 'serialNumber',
            message: isSameLine ? 'Serial already on this line.' : 'Serial already used on another line.',
          },
        ],
      });
    }

    // 23505 race fallback handled globally by api-sdk's pg-error filter.
    const entity = await this.repository.create({ stockAdjustmentLineId: lineId, serialNumber: trimmed });
    this.logger.log(`Added line item ${entity.id} (serial=${trimmed}) to line ${lineId}`);

    return {
      success: true,
      message: `Serial "${entity.serialNumber}" added successfully.`,
      data: StockAdjustmentLineItemDto.from(entity),
    };
  }

  async updateLineItem(
    adjustment: AdjustmentContext,
    lineId: string,
    itemId: string,
    data: { serialNumber: string },
  ): Promise<SuccessResponseDto> {
    if (adjustment.status !== StockAdjustmentStatusValues.DRAFT) {
      throw new BadRequestException('Line items can only be modified on DRAFT adjustments.');
    }

    const existing = await this.repository.findById(itemId);
    if (!existing || existing.stockAdjustmentLineId !== lineId) {
      throw new NotFoundException('Stock adjustment line item not found.');
    }

    const trimmed = data.serialNumber?.trim();
    if (!trimmed) {
      throw new ValidationException({
        label: 'Invalid Serial',
        detail: 'Serial number is required.',
        errors: [{ field: 'serialNumber', message: 'Serial number is required.' }],
      });
    }

    if (trimmed !== existing.serialNumber) {
      const dup = await this.repository.findBySerialOnAdjustment(adjustment.id, trimmed);
      if (dup) {
        const isSameLine = dup.stockAdjustmentLineId === lineId;
        throw new ConflictException({
          label: 'Duplicate Serial',
          detail: isSameLine
            ? `Serial "${trimmed}" already added to this line.`
            : `Serial "${trimmed}" is already used on another line of this adjustment.`,
          errors: [
            {
              field: 'serialNumber',
              message: isSameLine ? 'Serial already on this line.' : 'Serial already used on another line.',
            },
          ],
        });
      }
    }

    // 23505 race fallback handled globally by api-sdk's pg-error filter.
    const updated = await this.repository.update(itemId, { serialNumber: trimmed });
    return { success: true, message: `Serial "${updated.serialNumber}" updated successfully.` };
  }

  async removeLineItem(adjustment: AdjustmentContext, itemId: string): Promise<{ serialNumber: string }> {
    if (adjustment.status !== StockAdjustmentStatusValues.DRAFT) {
      throw new BadRequestException('Line items can only be modified on DRAFT adjustments.');
    }

    const existing = await this.repository.findById(itemId);
    if (!existing) {
      throw new NotFoundException('Stock adjustment line item not found.');
    }

    await this.repository.delete(itemId);
    return { serialNumber: existing.serialNumber };
  }
}
