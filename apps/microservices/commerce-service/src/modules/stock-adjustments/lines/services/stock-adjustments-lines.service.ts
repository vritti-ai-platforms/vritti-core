import { InventoryItemUomConversionsService } from '@domain/inventory-item-uom-conversions/services/inventory-item-uom-conversions.service';
import { InventoryItemsRepository } from '@domain/inventory-items/repositories/inventory-items.repository';
import type { StockAdjustmentLineDto } from '@domain/stock-adjustment-lines/dto/entity/stock-adjustment-line.dto';
import { StockAdjustmentLinesService } from '@domain/stock-adjustment-lines/services/stock-adjustment-lines.service';
import { StockAdjustmentsRepository } from '@domain/stock-adjustments/repositories/stock-adjustments.repository';
import { Injectable, Logger } from '@nestjs/common';
import { type CreateResponseDto, NotFoundException, type SuccessResponseDto, ValidationException } from '@vritti/api-sdk';

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

  async addOpeningLine(
    adjustmentId: string,
    data: {
      locationId: string;
      stockAdjustmentLotId?: string | null;
      quantity: number;
      uomId: string;
    },
  ): Promise<CreateResponseDto<StockAdjustmentLineDto>> {
    const t0 = Date.now();
    this.logger.log(`addOpeningLine — adjustment: ${adjustmentId}, uomId: ${data.uomId}, qty: ${data.quantity}`);

    const adjustment = await this.getAdjustmentContext(adjustmentId);
    this.logger.log(`addOpeningLine [getAdjustmentContext] ${Date.now() - t0}ms`);

    await this.validateUomId(adjustment, data.uomId);
    this.logger.log(`addOpeningLine [validateUomId] ${Date.now() - t0}ms`);

    const conversionFactor = await this.uomConversionsService.resolvePrimaryUomFactor(
      adjustment.inventoryItemId,
      data.uomId,
    );
    this.logger.log(`addOpeningLine [resolvePrimaryUomFactor] ${Date.now() - t0}ms`);

    const line = await this.linesService.addOpeningLine(adjustment, { ...data, conversionFactor });
    this.logger.log(`addOpeningLine [linesService.addOpeningLine] ${Date.now() - t0}ms`);

    return {
      success: true,
      message: `Line added to adjustment "${adjustment.code}" successfully.`,
      data: line,
    };
  }

  async addChangeLine(
    adjustmentId: string,
    data: {
      quantId: string;
      quantity: number;
      uomId: string;
    },
  ): Promise<CreateResponseDto<StockAdjustmentLineDto>> {
    this.logger.log(`addChangeLine — adjustment: ${adjustmentId}, uomId: ${data.uomId}, qty: ${data.quantity}`);
    const adjustment = await this.getAdjustmentContext(adjustmentId);
    await this.validateUomId(adjustment, data.uomId);
    const conversionFactor = await this.uomConversionsService.resolvePrimaryUomFactor(
      adjustment.inventoryItemId,
      data.uomId,
    );
    const line = await this.linesService.addChangeLine(adjustment, { ...data, conversionFactor });
    return {
      success: true,
      message: `Line added to adjustment "${adjustment.code}" successfully.`,
      data: line,
    };
  }

  async updateOpeningLine(
    adjustmentId: string,
    lineId: string,
    data: {
      locationId?: string;
      stockAdjustmentLotId?: string | null;
      quantity?: number;
      uomId?: string;
    },
  ): Promise<SuccessResponseDto> {
    this.logger.log(`updateOpeningLine — adjustment: ${adjustmentId}, line: ${lineId}`);
    const adjustment = await this.getAdjustmentContext(adjustmentId);

    if (data.uomId) {
      await this.validateUomId(adjustment, data.uomId);
      const conversionFactor = await this.uomConversionsService.resolvePrimaryUomFactor(
        adjustment.inventoryItemId,
        data.uomId,
      );
      await this.linesService.updateOpeningLine(adjustment, lineId, { ...data, conversionFactor });
    } else {
      await this.linesService.updateOpeningLine(adjustment, lineId, data);
    }

    return { success: true, message: 'Line updated successfully.' };
  }

  async updateChangeLine(
    adjustmentId: string,
    lineId: string,
    data: {
      quantId?: string;
      quantity?: number;
      uomId?: string;
    },
  ): Promise<SuccessResponseDto> {
    this.logger.log(`updateChangeLine — adjustment: ${adjustmentId}, line: ${lineId}`);
    const adjustment = await this.getAdjustmentContext(adjustmentId);

    if (data.uomId) {
      await this.validateUomId(adjustment, data.uomId);
      const conversionFactor = await this.uomConversionsService.resolvePrimaryUomFactor(
        adjustment.inventoryItemId,
        data.uomId,
      );
      await this.linesService.updateChangeLine(adjustment, lineId, { ...data, conversionFactor });
    } else {
      await this.linesService.updateChangeLine(adjustment, lineId, data);
    }

    return { success: true, message: 'Line updated successfully.' };
  }

  private async getAdjustmentContext(adjustmentId: string) {
    const adjustment = await this.adjustmentsRepository.findByIdWithItem(adjustmentId);
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
