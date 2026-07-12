import { InventoryItemsRepository } from '@domain/inventory-items/repositories/inventory-items.repository';
import type { StockAdjustmentLineDto } from '@domain/stock-adjustment-lines/dto/entity/stock-adjustment-line.dto';
import { StockAdjustmentLinesService } from '@domain/stock-adjustment-lines/services/stock-adjustment-lines.service';
import { StockAdjustmentLotsRepository } from '@domain/stock-adjustment-lots/repositories/stock-adjustment-lots.repository';
import { StockAdjustmentsRepository } from '@domain/stock-adjustments/repositories/stock-adjustments.repository';
import { UomConversionsService } from '@domain/uom-conversions/services/uom-conversions.service';
import { Injectable, Logger } from '@nestjs/common';
import type { CreateResponseDto, SuccessResponseDto } from '@vritti/api-sdk/database';
import { NotFoundException, ValidationException } from '@vritti/api-sdk/exceptions';
import { InventoryTrackingValues } from '@/db/schema';

// App-layer orchestrator for stock-adjustment line writes that need inventory-aggregate awareness.
// Handles UOM validation against the item's allowed set + converting the line quantity to the item's
// primary UOM (snapshot stored on the line) before delegating persistence to the domain service.
@Injectable()
export class StockAdjustmentsLinesService {
  private readonly logger = new Logger(StockAdjustmentsLinesService.name);

  constructor(
    private readonly linesService: StockAdjustmentLinesService,
    private readonly adjustmentsRepository: StockAdjustmentsRepository,
    private readonly lotsRepository: StockAdjustmentLotsRepository,
    private readonly inventoryItemsRepository: InventoryItemsRepository,
    private readonly uomConversionsService: UomConversionsService,
  ) {}

  async addOpeningLine(
    adjustmentId: string,
    data: {
      locationId: string;
      stockAdjustmentLotId?: string | null;
      uomQty: number;
      uomId: string;
    },
  ): Promise<CreateResponseDto<StockAdjustmentLineDto>> {
    const t0 = Date.now();
    this.logger.log(`addOpeningLine — adjustment: ${adjustmentId}, uomId: ${data.uomId}, qty: ${data.uomQty}`);

    const adjustment = await this.getAdjustmentContext(adjustmentId);
    this.logger.log(`addOpeningLine [getAdjustmentContext] ${Date.now() - t0}ms`);

    await this.validateUomId(adjustment, data.uomId);
    this.logger.log(`addOpeningLine [validateUomId] ${Date.now() - t0}ms`);

    const primaryUomQty = await this.uomConversionsService.toPrimaryUomQuantity(
      adjustment.inventoryItemId,
      data.uomId,
      data.uomQty,
    );
    this.logger.log(`addOpeningLine [toPrimaryUomQuantity] ${Date.now() - t0}ms`);

    if (data.stockAdjustmentLotId) {
      await this.validateLotOwnership(adjustmentId, data.stockAdjustmentLotId);
      this.logger.log(`addOpeningLine [validateLotOwnership] ${Date.now() - t0}ms`);
    }

    const line = await this.linesService.addOpeningLine(adjustment, { ...data, primaryUomQty });
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
      uomQty: number;
      uomId: string;
    },
  ): Promise<CreateResponseDto<StockAdjustmentLineDto>> {
    this.logger.log(`addChangeLine — adjustment: ${adjustmentId}, uomId: ${data.uomId}, qty: ${data.uomQty}`);
    const adjustment = await this.getAdjustmentContext(adjustmentId);
    await this.validateUomId(adjustment, data.uomId);
    const primaryUomQty = await this.uomConversionsService.toPrimaryUomQuantity(
      adjustment.inventoryItemId,
      data.uomId,
      data.uomQty,
    );
    const line = await this.linesService.addChangeLine(adjustment, { ...data, primaryUomQty });
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
      uomQty?: number;
      uomId?: string;
    },
  ): Promise<SuccessResponseDto> {
    this.logger.log(`updateOpeningLine — adjustment: ${adjustmentId}, line: ${lineId}`);
    const adjustment = await this.getAdjustmentContext(adjustmentId);

    if (data.stockAdjustmentLotId) {
      await this.validateLotOwnership(adjustmentId, data.stockAdjustmentLotId);
    }

    if (data.uomId) await this.validateUomId(adjustment, data.uomId);

    const primaryUomQty = await this.recomputePrimaryQtyForUpdate(
      adjustment.inventoryItemId,
      adjustmentId,
      lineId,
      data,
    );

    await this.linesService.updateOpeningLine(adjustment, lineId, { ...data, primaryUomQty });

    return { success: true, message: 'Line updated successfully.' };
  }

  // Removes a line from a DRAFT adjustment — fetches the adjustment context then delegates to domain
  async removeLine(adjustmentId: string, lineId: string): Promise<SuccessResponseDto> {
    this.logger.log(`removeLine — adjustment: ${adjustmentId}, line: ${lineId}`);
    const adjustment = await this.getAdjustmentContext(adjustmentId);
    await this.linesService.removeLine(adjustment, lineId);
    return { success: true, message: 'Line removed successfully.' };
  }

  async updateChangeLine(
    adjustmentId: string,
    lineId: string,
    data: {
      quantId?: string;
      uomQty?: number;
      uomId?: string;
    },
  ): Promise<SuccessResponseDto> {
    this.logger.log(`updateChangeLine — adjustment: ${adjustmentId}, line: ${lineId}`);
    const adjustment = await this.getAdjustmentContext(adjustmentId);

    if (data.uomId) await this.validateUomId(adjustment, data.uomId);

    const primaryUomQty = await this.recomputePrimaryQtyForUpdate(
      adjustment.inventoryItemId,
      adjustmentId,
      lineId,
      data,
    );

    await this.linesService.updateChangeLine(adjustment, lineId, { ...data, primaryUomQty });

    return { success: true, message: 'Line updated successfully.' };
  }

  // Recomputes the primary-qty snapshot when either uomQty or uomId changes; returns undefined otherwise
  // so the domain update leaves the existing snapshot in place. Fetches the existing line so callers
  // can update just one of (uomQty, uomId).
  private async recomputePrimaryQtyForUpdate(
    inventoryItemId: string,
    adjustmentId: string,
    lineId: string,
    data: { uomQty?: number; uomId?: string },
  ): Promise<number | undefined> {
    if (data.uomQty === undefined && data.uomId === undefined) return undefined;
    const existing = await this.linesService.findById(adjustmentId, lineId);
    const effectiveQty = data.uomQty ?? existing.uomQty;
    const effectiveUomId = data.uomId ?? existing.uomId;
    return this.uomConversionsService.toPrimaryUomQuantity(inventoryItemId, effectiveUomId, effectiveQty);
  }

  private async getAdjustmentContext(adjustmentId: string) {
    const adjustment = await this.adjustmentsRepository.findByIdWithItem(adjustmentId);
    if (!adjustment) throw new NotFoundException('Stock adjustment not found.');
    return adjustment;
  }

  // Verifies the given lot belongs to the specified adjustment — domain trusts tracking-type checks only
  private async validateLotOwnership(adjustmentId: string, stockAdjustmentLotId: string): Promise<void> {
    const lot = await this.lotsRepository.findById(stockAdjustmentLotId);
    if (!lot || lot.stockAdjustmentId !== adjustmentId) {
      throw new ValidationException({
        detail: 'Lot does not belong to this adjustment.',
        errors: [{ field: 'stockAdjustmentLotId', message: 'Invalid lot reference.' }],
      });
    }
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
    if (tracking === InventoryTrackingValues.SERIAL || tracking === InventoryTrackingValues.LOT_SERIAL) {
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
