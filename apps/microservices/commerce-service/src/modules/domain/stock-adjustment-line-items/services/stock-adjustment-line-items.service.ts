import { StockAdjustmentLinesRepository } from '@domain/stock-adjustment-lines/repositories/stock-adjustment-lines.repository';
import { StockAdjustmentLinesService } from '@domain/stock-adjustment-lines/services/stock-adjustment-lines.service';
import { StockAdjustmentsRepository } from '@domain/stock-adjustments/repositories/stock-adjustments.repository';
import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import {
  BadRequestException,
  ConflictException,
  type CreateResponseDto,
  type FieldMap,
  FilterProcessor,
  type SuccessResponseDto,
  type TableViewState,
  ValidationException,
} from '@vritti/api-sdk';
import { and } from '@vritti/api-sdk/drizzle-orm';
import { StockAdjustmentStatusValues, stockAdjustmentLineItems } from '@/db/schema';
import { StockAdjustmentLineItemDto } from '../dto/entity/stock-adjustment-line-item.dto';
import { StockAdjustmentLineItemsRepository } from '../repositories/stock-adjustment-line-items.repository';

@Injectable()
export class StockAdjustmentLineItemsService {
  private readonly logger = new Logger(StockAdjustmentLineItemsService.name);

  private static readonly FIELD_MAP: FieldMap = {
    serialNumber: { column: stockAdjustmentLineItems.serialNumber, type: 'string' },
  };

  constructor(
    private readonly repository: StockAdjustmentLineItemsRepository,
    private readonly linesRepository: StockAdjustmentLinesRepository,
    private readonly linesService: StockAdjustmentLinesService,
    private readonly adjustmentsRepository: StockAdjustmentsRepository,
  ) {}

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

  // For tracking='serial' lines:
  //   - OPENING_STOCK: register a NEW serial — must not exist in inventory_item_quant_items for this item
  //   - Deduct types:  consume an EXISTING serial — must be AVAILABLE on the line's quant
  async addLineItem(
    adjustmentId: string,
    lineId: string,
    data: { serialNumber: string },
  ): Promise<CreateResponseDto<StockAdjustmentLineItemDto>> {
    const adjustment = await this.getAdjustmentContext(adjustmentId);
    if (adjustment.status !== StockAdjustmentStatusValues.DRAFT) {
      throw new BadRequestException('Line items can only be modified on DRAFT adjustments.');
    }
    if (adjustment.inventoryItemTracking !== 'serial' && adjustment.inventoryItemTracking !== 'lot_serial') {
      throw new BadRequestException('Line items are only allowed on serial-tracked adjustments.');
    }

    const line = await this.linesRepository.findById(lineId);
    if (!line || line.stockAdjustmentId !== adjustmentId) {
      throw new NotFoundException('Stock adjustment line not found.');
    }

    // Enforce capacity: number of serial items must not exceed the line's quantity
    const currentCount = await this.repository.countByLineId(lineId);
    if (currentCount >= line.quantity) {
      throw new BadRequestException({
        label: 'Line Capacity Reached',
        detail: `This line allows ${line.quantity} serial item(s). All slots are already filled.`,
      });
    }

    const trimmed = data.serialNumber?.trim();
    if (!trimmed) {
      throw new ValidationException({
        detail: 'Serial number is required.',
        errors: [{ field: 'serialNumber', message: 'Serial number is required.' }],
      });
    }

    const dup = await this.repository.findBySerialOnAdjustment(adjustmentId, trimmed);
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

    const entity = await this.repository.create({
      stockAdjustmentLineId: lineId,
      serialNumber: trimmed,
    });
    await this.linesService.refreshIsBalanced(adjustmentId, lineId);
    this.logger.log(`Added line item ${entity.id} (serial=${trimmed}) to line ${lineId}`);

    return {
      success: true,
      message: `Serial "${entity.serialNumber}" added successfully.`,
      data: StockAdjustmentLineItemDto.from(entity),
    };
  }

  async updateLineItem(
    adjustmentId: string,
    lineId: string,
    itemId: string,
    data: { serialNumber: string },
  ): Promise<SuccessResponseDto> {
    const adjustment = await this.getAdjustmentContext(adjustmentId);
    if (adjustment.status !== StockAdjustmentStatusValues.DRAFT) {
      throw new BadRequestException('Line items can only be modified on DRAFT adjustments.');
    }

    const line = await this.linesRepository.findById(lineId);
    if (!line || line.stockAdjustmentId !== adjustmentId) {
      throw new NotFoundException('Stock adjustment line not found.');
    }

    const existing = await this.repository.findById(itemId);
    if (!existing || existing.stockAdjustmentLineId !== lineId) {
      throw new NotFoundException('Stock adjustment line item not found.');
    }

    const trimmed = data.serialNumber?.trim();
    if (!trimmed) {
      throw new ValidationException({
        detail: 'Serial number is required.',
        errors: [{ field: 'serialNumber', message: 'Serial number is required.' }],
      });
    }

    if (trimmed !== existing.serialNumber) {
      const dup = await this.repository.findBySerialOnAdjustment(adjustmentId, trimmed);
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

    const updated = await this.repository.update(itemId, { serialNumber: trimmed });
    await this.linesService.refreshIsBalanced(adjustmentId, lineId);
    return { success: true, message: `Serial "${updated.serialNumber}" updated successfully.` };
  }

  async removeLineItem(adjustmentId: string, lineId: string, itemId: string): Promise<SuccessResponseDto> {
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
    await this.linesService.refreshIsBalanced(adjustmentId, lineId);
    return { success: true, message: `Serial "${existing.serialNumber}" removed successfully.` };
  }

  private async ensureLineBelongsToAdjustment(adjustmentId: string, lineId: string): Promise<void> {
    const line = await this.linesRepository.findById(lineId);
    if (!line || line.stockAdjustmentId !== adjustmentId) {
      throw new NotFoundException('Stock adjustment line not found.');
    }
  }

  private async getAdjustmentContext(adjustmentId: string) {
    const adjustment = await this.adjustmentsRepository.findByIdWithItem(adjustmentId);
    if (!adjustment) throw new NotFoundException('Stock adjustment not found.');
    return adjustment;
  }
}
