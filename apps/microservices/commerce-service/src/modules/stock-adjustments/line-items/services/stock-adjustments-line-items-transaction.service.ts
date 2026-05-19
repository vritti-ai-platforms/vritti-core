import { InventoryItemQuantsRepository } from '@domain/inventory-item-quants/repositories/inventory-item-quants.repository';
import type { StockAdjustmentLineItemDto } from '@domain/stock-adjustment-line-items/dto/entity/stock-adjustment-line-item.dto';
import { StockAdjustmentLineItemsService } from '@domain/stock-adjustment-line-items/services/stock-adjustment-line-items.service';
import { StockAdjustmentLinesRepository } from '@domain/stock-adjustment-lines/repositories/stock-adjustment-lines.repository';
import { StockAdjustmentsRepository } from '@domain/stock-adjustments/repositories/stock-adjustments.repository';
import { Injectable, NotFoundException } from '@nestjs/common';
import {
  BadRequestException,
  type CreateResponseDto,
  type SuccessResponseDto,
  type TableViewState,
  ValidationException,
} from '@vritti/api-sdk';
import { SerialStatusValues, StockAdjustmentTypeValues } from '@/db/schema';

@Injectable()
export class StockAdjustmentsLineItemsTransactionService {
  constructor(
    private readonly lineItemsService: StockAdjustmentLineItemsService,
    private readonly adjustmentsRepository: StockAdjustmentsRepository,
    private readonly linesRepository: StockAdjustmentLinesRepository,
    private readonly quantsRepository: InventoryItemQuantsRepository,
  ) {}

  async lineItemsTable(
    data: { adjustmentId: string; lineId: string } & TableViewState,
  ): Promise<{ result: StockAdjustmentLineItemDto[]; count: number }> {
    await this.getLineContext(data.adjustmentId, data.lineId);
    return this.lineItemsService.findForTable(data.lineId, data);
  }

  async addLineItem(data: {
    adjustmentId: string;
    lineId: string;
    serialNumber: string;
  }): Promise<CreateResponseDto<StockAdjustmentLineItemDto>> {
    const { line, adjustment } = await this.getLineContext(data.adjustmentId, data.lineId);

    const currentCount = await this.lineItemsService.countByLineId(data.lineId);
    if (currentCount >= line.quantity) {
      throw new BadRequestException({
        label: 'Line Capacity Reached',
        detail: `This line allows ${line.quantity} serial item(s). All slots are already filled.`,
      });
    }

    const trimmed = data.serialNumber?.trim();
    if (trimmed) {
      await this.validateSerialForIntent(adjustment, line, trimmed);
    }

    const result = await this.lineItemsService.addLineItem(adjustment, data.lineId, {
      serialNumber: data.serialNumber,
    });
    await this.linesRepository.refreshIsBalanced(data.lineId, adjustment.inventoryItemTracking);
    return result;
  }

  async updateLineItem(data: {
    adjustmentId: string;
    lineId: string;
    itemId: string;
    serialNumber: string;
  }): Promise<SuccessResponseDto> {
    const { line, adjustment } = await this.getLineContext(data.adjustmentId, data.lineId);

    const trimmed = data.serialNumber?.trim();
    if (trimmed) {
      await this.validateSerialForIntent(adjustment, line, trimmed);
    }

    const result = await this.lineItemsService.updateLineItem(adjustment, data.lineId, data.itemId, {
      serialNumber: data.serialNumber,
    });
    await this.linesRepository.refreshIsBalanced(data.lineId, adjustment.inventoryItemTracking);
    return result;
  }

  async removeLineItem(data: { adjustmentId: string; lineId: string; itemId: string }): Promise<SuccessResponseDto> {
    const { adjustment } = await this.getLineContext(data.adjustmentId, data.lineId);
    const { serialNumber } = await this.lineItemsService.removeLineItem(adjustment, data.itemId);
    await this.linesRepository.refreshIsBalanced(data.lineId, adjustment.inventoryItemTracking);
    return { success: true, message: `Serial "${serialNumber}" removed successfully.` };
  }

  // OPENING+item: serial must NOT already exist for this item (would collide with inventory_item_serials unique).
  // Deduct+item: serial must exist on an inventory_item_serial where parent_quant = line.quantId AND status=AVAILABLE.
  private async validateSerialForIntent(
    adjustment: { id: string; type: string; inventoryItemId: string },
    line: { id: string; quantId: string | null },
    serialNumber: string,
  ): Promise<void> {
    const lineQuantId = line.quantId ?? null;
    const isOpening = adjustment.type === StockAdjustmentTypeValues.OPENING_STOCK;

    if (isOpening) {
      const existing = await this.quantsRepository.findSerial(adjustment.inventoryItemId, serialNumber);
      if (existing) {
        throw new ValidationException({
          label: 'Duplicate Serial',
          detail: `Serial "${serialNumber}" already exists in inventory.`,
          errors: [{ field: 'serialNumber', message: 'Serial already exists in inventory.' }],
        });
      }
      return;
    }

    if (!lineQuantId) {
      throw new ValidationException({
        label: 'Missing Quant',
        detail: 'Cannot pick units without a quant on the line.',
        errors: [{ field: 'serialNumber', message: 'Line is missing a quant.' }],
      });
    }
    const existing = await this.quantsRepository.findSerial(adjustment.inventoryItemId, serialNumber);
    if (!existing) {
      throw new ValidationException({
        label: 'Serial Not Found',
        detail: `Serial "${serialNumber}" does not exist in inventory.`,
        errors: [{ field: 'serialNumber', message: 'Serial not found in inventory.' }],
      });
    }
    if (existing.inventoryItemQuantId !== lineQuantId) {
      throw new ValidationException({
        label: 'Wrong Quant',
        detail: `Serial "${serialNumber}" does not belong to the selected quant.`,
        errors: [{ field: 'serialNumber', message: 'Serial belongs to a different quant.' }],
      });
    }
    if (existing.status !== SerialStatusValues.AVAILABLE) {
      throw new ValidationException({
        label: 'Not Available',
        detail: `Serial "${serialNumber}" is not AVAILABLE (current status: ${existing.status}).`,
        errors: [{ field: 'serialNumber', message: 'Serial is not available.' }],
      });
    }
  }

  private async getLineContext(adjustmentId: string, lineId: string) {
    const [line, adjustment] = await Promise.all([
      this.linesRepository.findById(lineId),
      this.adjustmentsRepository.findByIdWithItem(adjustmentId),
    ]);
    if (!adjustment) throw new NotFoundException('Stock adjustment not found.');
    if (!line || line.stockAdjustmentId !== adjustmentId)
      throw new NotFoundException('Stock adjustment line not found.');
    return { line, adjustment };
  }
}
