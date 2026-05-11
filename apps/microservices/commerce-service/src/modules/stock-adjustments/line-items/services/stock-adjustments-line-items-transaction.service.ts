import { InventoryItemQuantsRepository } from '@domain/inventory-item-quants/repositories/inventory-item-quants.repository';
import type { StockAdjustmentLineItemDto } from '@domain/stock-adjustment-line-items/dto/entity/stock-adjustment-line-item.dto';
import { StockAdjustmentLineItemsService } from '@domain/stock-adjustment-line-items/services/stock-adjustment-line-items.service';
import { StockAdjustmentLinesRepository } from '@domain/stock-adjustment-lines/repositories/stock-adjustment-lines.repository';
import { StockAdjustmentsRepository } from '@domain/stock-adjustments/repositories/stock-adjustments.repository';
import { Injectable, NotFoundException } from '@nestjs/common';
import { type SuccessResponseDto, type TableViewState, ValidationException } from '@vritti/api-sdk';
import { QuantItemStatusValues, StockAdjustmentTypeValues } from '@/db/schema';

// App-layer service for line-item operations that need to check inventory-aggregate state
// (e.g. is this serial already used in inventory_item_quant_items, and what status / which quant).
@Injectable()
export class StockAdjustmentsLineItemsTransactionService {
  constructor(
    private readonly lineItemsService: StockAdjustmentLineItemsService,
    private readonly adjustmentsRepository: StockAdjustmentsRepository,
    private readonly linesRepository: StockAdjustmentLinesRepository,
    private readonly quantsRepository: InventoryItemQuantsRepository,
  ) {}

  lineItems(adjustmentId: string, lineId: string): Promise<StockAdjustmentLineItemDto[]> {
    return this.lineItemsService.listByLine(adjustmentId, lineId);
  }

  lineItemsTable(
    data: { adjustmentId: string; lineId: string } & TableViewState,
  ): Promise<{ result: StockAdjustmentLineItemDto[]; count: number }> {
    return this.lineItemsService.findForTable(data.adjustmentId, data.lineId, data);
  }

  async addLineItem(data: {
    adjustmentId: string;
    lineId: string;
    serialNumber: string;
  }): Promise<StockAdjustmentLineItemDto> {
    const trimmed = data.serialNumber?.trim();
    if (trimmed) {
      await this.validateSerialForIntent(data.adjustmentId, data.lineId, trimmed);
    }
    return this.lineItemsService.addLineItem(data.adjustmentId, data.lineId, { serialNumber: data.serialNumber });
  }

  async updateLineItem(data: {
    adjustmentId: string;
    lineId: string;
    itemId: string;
    serialNumber: string;
  }): Promise<StockAdjustmentLineItemDto> {
    const trimmed = data.serialNumber?.trim();
    if (trimmed) {
      await this.validateSerialForIntent(data.adjustmentId, data.lineId, trimmed);
    }
    return this.lineItemsService.updateLineItem(data.adjustmentId, data.lineId, data.itemId, {
      serialNumber: data.serialNumber,
    });
  }

  removeLineItem(data: { adjustmentId: string; lineId: string; itemId: string }): Promise<SuccessResponseDto> {
    return this.lineItemsService.removeLineItem(data.adjustmentId, data.lineId, data.itemId);
  }

  // OPENING+item: serial must NOT already exist for this item (would collide with inventory_item_quant_items unique).
  // Deduct+item: serial must exist on a quant_item where parent_quant = line.quantId AND status=AVAILABLE.
  private async validateSerialForIntent(
    adjustmentId: string,
    lineId: string,
    serialNumber: string,
  ): Promise<void> {
    const adjustment = await this.adjustmentsRepository.findByIdWithItemName(adjustmentId);
    if (!adjustment) throw new NotFoundException('Stock adjustment not found.');
    const line = await this.linesRepository.findLineById(lineId);
    if (!line || line.stockAdjustmentId !== adjustmentId) {
      throw new NotFoundException('Stock adjustment line not found.');
    }
    const lineQuantId = line.quantId ?? null;
    const isOpening = adjustment.type === StockAdjustmentTypeValues.OPENING_STOCK;

    if (isOpening) {
      const existing = await this.quantsRepository.findQuantItemBySerial(adjustment.inventoryItemId, serialNumber);
      if (existing) {
        throw new ValidationException({
          detail: `Serial "${serialNumber}" already exists in inventory.`,
          errors: [{ field: 'serialNumber', message: 'Serial already exists in inventory.' }],
        });
      }
      return;
    }

    if (!lineQuantId) {
      throw new ValidationException({
        detail: 'Cannot pick units without a quant on the line.',
        errors: [{ field: 'serialNumber', message: 'Line is missing a quant.' }],
      });
    }
    const existing = await this.quantsRepository.findQuantItemBySerial(adjustment.inventoryItemId, serialNumber);
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
