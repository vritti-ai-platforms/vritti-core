import { InventoryItemQuantsRepository } from '@domain/inventory-item-quants/repositories/inventory-item-quants.repository';
import { StockAdjustmentLinesRepository } from '@domain/stock-adjustment-lines/repositories/stock-adjustment-lines.repository';
import { StockAdjustmentLinesService } from '@domain/stock-adjustment-lines/services/stock-adjustment-lines.service';
import { StockAdjustmentsRepository } from '@domain/stock-adjustments/repositories/stock-adjustments.repository';
import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import {
  BadRequestException,
  type FieldMap,
  FilterProcessor,
  type SuccessResponseDto,
  type TableViewState,
  ValidationException,
} from '@vritti/api-sdk';
import { and, eq } from '@vritti/api-sdk/drizzle-orm';
import {
  inventoryItemQuantItems,
  QuantItemStatusValues,
  type StockAdjustment,
  StockAdjustmentStatusValues,
  type StockAdjustmentType,
  StockAdjustmentTypeValues,
  stockAdjustmentLineItems,
} from '@/db/schema';
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
    private readonly quantsRepository: InventoryItemQuantsRepository,
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

  // For tracking='serial' lines:
  //   - OPENING_STOCK: register a NEW serial — must not exist in inventory_item_quant_items for this item
  //   - Deduct types:  consume an EXISTING serial — must be AVAILABLE on the line's quant
  async addLineItem(
    adjustmentId: string,
    lineId: string,
    data: { serialNumber: string },
  ): Promise<StockAdjustmentLineItemDto> {
    const adjustment = await this.getAdjustmentContext(adjustmentId);
    if (adjustment.status !== StockAdjustmentStatusValues.DRAFT) {
      throw new BadRequestException('Line items can only be modified on DRAFT adjustments.');
    }
    if (adjustment.inventoryItemTracking !== 'serial' && adjustment.inventoryItemTracking !== 'lot_serial') {
      throw new BadRequestException('Line items are only allowed on serial-tracked adjustments.');
    }

    const line = await this.linesRepository.findLineById(lineId);
    if (!line || line.stockAdjustmentId !== adjustmentId) {
      throw new NotFoundException('Stock adjustment line not found.');
    }

    const trimmed = data.serialNumber?.trim();
    if (!trimmed) {
      throw new ValidationException({
        detail: 'Serial number is required.',
        errors: [{ field: 'serialNumber', message: 'Serial number is required.' }],
      });
    }

    // Already on this line?
    const dup = await this.repository.findBySerialOnLine(lineId, trimmed);
    if (dup) {
      throw new ValidationException({
        detail: `Serial "${trimmed}" already added to this line.`,
        errors: [{ field: 'serialNumber', message: 'Serial already on this line.' }],
      });
    }

    await this.validateSerialForIntent(adjustment, line.quantId ?? null, trimmed);

    const entity = await this.repository.create({
      stockAdjustmentLineId: lineId,
      serialNumber: trimmed,
    });
    await this.linesService.refreshIsBalanced(adjustmentId, lineId);
    this.logger.log(`Added line item ${entity.id} (serial=${trimmed}) to line ${lineId}`);
    return StockAdjustmentLineItemDto.from(entity);
  }

  async updateLineItem(
    adjustmentId: string,
    lineId: string,
    itemId: string,
    data: { serialNumber: string },
  ): Promise<StockAdjustmentLineItemDto> {
    const adjustment = await this.getAdjustmentContext(adjustmentId);
    if (adjustment.status !== StockAdjustmentStatusValues.DRAFT) {
      throw new BadRequestException('Line items can only be modified on DRAFT adjustments.');
    }

    const line = await this.linesRepository.findLineById(lineId);
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
      const dup = await this.repository.findBySerialOnLine(lineId, trimmed);
      if (dup) {
        throw new ValidationException({
          detail: `Serial "${trimmed}" already added to this line.`,
          errors: [{ field: 'serialNumber', message: 'Serial already on this line.' }],
        });
      }
      await this.validateSerialForIntent(adjustment, line.quantId ?? null, trimmed);
    }

    const updated = await this.repository.update(itemId, { serialNumber: trimmed });
    await this.linesService.refreshIsBalanced(adjustmentId, lineId);
    return StockAdjustmentLineItemDto.from(updated);
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

  // OPENING+item: serial must NOT already exist for this item (would collide with inventory_item_quant_items unique).
  // Deduct+item: serial must exist on a quant_item where parent_quant = line.quantId AND status=AVAILABLE.
  private async validateSerialForIntent(
    adjustment: StockAdjustment & { inventoryItemTracking: 'quantity' | 'lot' | 'serial' | 'lot_serial' },
    lineQuantId: string | null,
    serialNumber: string,
  ): Promise<void> {
    const isOpening = adjustment.type === StockAdjustmentTypeValues.OPENING_STOCK;
    if (isOpening) {
      // Reject collision with existing inventory serial
      const existing = await this.findInventoryQuantItemBySerial(adjustment.inventoryItemId, serialNumber);
      if (existing) {
        throw new ValidationException({
          detail: `Serial "${serialNumber}" already exists in inventory.`,
          errors: [{ field: 'serialNumber', message: 'Serial already exists in inventory.' }],
        });
      }
    } else {
      if (!lineQuantId) {
        throw new ValidationException({
          detail: 'Cannot pick units without a quant on the line.',
          errors: [{ field: 'serialNumber', message: 'Line is missing a quant.' }],
        });
      }
      const existing = await this.findInventoryQuantItemBySerial(adjustment.inventoryItemId, serialNumber);
      if (!existing) {
        throw new ValidationException({
          detail: `Serial "${serialNumber}" does not exist in inventory.`,
          errors: [{ field: 'serialNumber', message: 'Serial not found in inventory.' }],
        });
      }
      if (existing.inventoryItemQuantId !== lineQuantId) {
        throw new ValidationException({
          detail: `Serial "${serialNumber}" does not belong to the selected quant.`,
          errors: [{ field: 'serialNumber', message: 'Serial belongs to a different quant.' }],
        });
      }
      if (existing.status !== QuantItemStatusValues.AVAILABLE) {
        throw new ValidationException({
          detail: `Serial "${serialNumber}" is not AVAILABLE (current status: ${existing.status}).`,
          errors: [{ field: 'serialNumber', message: 'Serial is not available.' }],
        });
      }
    }
  }

  private async findInventoryQuantItemBySerial(
    inventoryItemId: string,
    serialNumber: string,
  ): Promise<{ id: string; inventoryItemQuantId: string; status: string } | null> {
    const rows = await this.quantsRepository['db']
      .select({
        id: inventoryItemQuantItems.id,
        inventoryItemQuantId: inventoryItemQuantItems.inventoryItemQuantId,
        status: inventoryItemQuantItems.status,
      })
      .from(inventoryItemQuantItems)
      .where(
        and(
          eq(inventoryItemQuantItems.inventoryItemId, inventoryItemId),
          eq(inventoryItemQuantItems.serialNumber, serialNumber),
        ),
      )
      .limit(1);
    return (rows[0] as { id: string; inventoryItemQuantId: string; status: string } | undefined) ?? null;
  }

  private async ensureLineBelongsToAdjustment(adjustmentId: string, lineId: string): Promise<void> {
    const line = await this.linesRepository.findLineById(lineId);
    if (!line || line.stockAdjustmentId !== adjustmentId) {
      throw new NotFoundException('Stock adjustment line not found.');
    }
  }

  private async getAdjustmentContext(adjustmentId: string) {
    const adjustment = await this.adjustmentsRepository.findByIdWithItemName(adjustmentId);
    if (!adjustment) throw new NotFoundException('Stock adjustment not found.');
    return adjustment;
  }
}
// silence unused import warning if StockAdjustmentType isn't directly referenced
void ({} as StockAdjustmentType | undefined);
