import { InventoryItemUomConversionsService } from '@domain/inventory-item-uom-conversions/services/inventory-item-uom-conversions.service';
import { InventoryItemsRepository } from '@domain/inventory-items/repositories/inventory-items.repository';
import type { StockAdjustmentLineDto } from '@domain/stock-adjustment-lines/dto/entity/stock-adjustment-line.dto';
import { StockAdjustmentLinesService } from '@domain/stock-adjustment-lines/services/stock-adjustment-lines.service';
import { StockAdjustmentsRepository } from '@domain/stock-adjustments/repositories/stock-adjustments.repository';
import { Injectable, Logger } from '@nestjs/common';
import { type CreateResponseDto, NotFoundException, ValidationException } from '@vritti/api-sdk';

// App-layer orchestrator for stock-adjustment line writes that need inventory-aggregate awareness.
// Handles UOM validation against the item's allowed set + conversion-factor resolution before
// delegating persistence to the pure-aggregate domain service.
@Injectable()
export class StockAdjustmentsLinesService {
  private readonly logger = new Logger(StockAdjustmentsLinesService.name);

  constructor(
    private readonly linesService: StockAdjustmentLinesService,
    private readonly adjustmentsRepository: StockAdjustmentsRepository,
    private readonly inventoryItemsRepository: InventoryItemsRepository,
    private readonly uomConversionsService: InventoryItemUomConversionsService,
  ) {}

  async addLine(
    adjustmentId: string,
    data: {
      createdById: string;
      stockAdjustmentLotId?: string | null;
      locationId?: string | null;
      quantId?: string | null;
      uomId: string;
      quantity: number;
    },
  ): Promise<CreateResponseDto<StockAdjustmentLineDto>> {
    const adjustment = await this.getAdjustmentContext(adjustmentId);
    await this.validateUomId(adjustment, data.uomId);
    const conversionFactor = await this.uomConversionsService.resolveFactor(adjustment.inventoryItemId, data.uomId);

    // Store quantity in primary UOM; conversionFactor is kept as a snapshot for auditing
    const quantityInPrimaryUom = data.quantity * conversionFactor;
    const line = await this.linesService.addLine(adjustment, {
      ...data,
      quantity: quantityInPrimaryUom,
      conversionFactor,
    });
    return {
      success: true,
      message: `Line added to adjustment "${adjustment.code}" successfully.`,
      data: line,
    };
  }

  async updateLine(
    adjustmentId: string,
    lineId: string,
    data: {
      quantity?: number;
      stockAdjustmentLotId?: string | null;
      locationId?: string | null;
      quantId?: string | null;
      uomId?: string;
    },
  ): Promise<StockAdjustmentLineDto> {
    const adjustment = await this.getAdjustmentContext(adjustmentId);
    if (data.uomId !== undefined) {
      await this.validateUomId(adjustment, data.uomId);
    }
    const conversionFactor =
      data.uomId !== undefined
        ? await this.uomConversionsService.resolveFactor(adjustment.inventoryItemId, data.uomId)
        : undefined;

    // Convert quantity to primary UOM when both quantity and uomId are being updated
    const quantityInPrimaryUom =
      data.quantity !== undefined && conversionFactor !== undefined ? data.quantity * conversionFactor : data.quantity;

    return this.linesService.updateLine(adjustment, lineId, {
      ...data,
      quantity: quantityInPrimaryUom,
      conversionFactor,
    });
  }

  private async getAdjustmentContext(adjustmentId: string) {
    const adjustment = await this.adjustmentsRepository.findByIdWithItemName(adjustmentId);
    if (!adjustment) throw new NotFoundException('Stock adjustment not found.');
    return adjustment;
  }

  // Validates that the supplied uomId is in the item's allowed set. Serial-tracked items
  // are restricted to the primary UOM since quants store serials 1:1.
  private async validateUomId(
    adjustment: { inventoryItemId: string; inventoryItemUomId: string; inventoryItemTracking: string },
    uomId: string,
  ): Promise<void> {
    if (!uomId) {
      throw new ValidationException({
        detail: 'UOM is required.',
        errors: [{ field: 'uomId', message: 'UOM is required.' }],
      });
    }
    const tracking = adjustment.inventoryItemTracking;
    if (tracking === 'serial' || tracking === 'lot_serial') {
      if (uomId !== adjustment.inventoryItemUomId) {
        throw new ValidationException({
          detail: 'Serial-tracked items must use the primary UOM.',
          errors: [{ field: 'uomId', message: 'Serial-tracked items must use the primary UOM.' }],
        });
      }
      return;
    }
    const allowed = await this.inventoryItemsRepository.findAllowedUomIds(adjustment.inventoryItemId);
    if (!allowed.includes(uomId)) {
      throw new ValidationException({
        detail: 'Selected UOM is not allowed for this inventory item.',
        errors: [{ field: 'uomId', message: 'UOM not allowed for this item.' }],
      });
    }
  }
}
