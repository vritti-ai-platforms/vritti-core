import { InventoryItemQuantsService } from '@domain/inventory-item-quants/services/inventory-item-quants.service';
import { InventoryItemLedgerService } from '@domain/inventory-item-ledger/services/inventory-item-ledger.service';
import { StockAdjustmentLineItemsRepository } from '@domain/stock-adjustment-line-items/repositories/stock-adjustment-line-items.repository';
import type { StockAdjustmentLineWithRefs } from '@domain/stock-adjustment-lines/repositories/stock-adjustment-lines.repository';
import { StockAdjustmentLinesRepository } from '@domain/stock-adjustment-lines/repositories/stock-adjustment-lines.repository';
import { StockAdjustmentLinesService } from '@domain/stock-adjustment-lines/services/stock-adjustment-lines.service';
import { StockAdjustmentLotsRepository } from '@domain/stock-adjustment-lots/repositories/stock-adjustment-lots.repository';
import { type StockAdjustmentDto } from '@domain/stock-adjustments/dto/entity/stock-adjustment.dto';
import { StockAdjustmentsRepository } from '@domain/stock-adjustments/repositories/stock-adjustments.repository';
import { StockAdjustmentsService } from '@domain/stock-adjustments/services/stock-adjustments.service';
import { Injectable, Logger } from '@nestjs/common';
import {
  BadRequestException,
  type CreateResponseDto,
  NotFoundException,
  PrimaryDatabaseService,
  type SuccessResponseDto,
  type TableViewState,
} from '@vritti/api-sdk';
import _ from '@vritti/api-sdk/lodash';
import {
  InventoryItemLedgerReferenceTypeValues,
  InventoryItemLedgerTypeValues,
  type InventoryTracking,
  InventoryTrackingValues,
  type StockAdjustment,
  type StockAdjustmentLineItem,
  type StockAdjustmentLot,
  StockAdjustmentStatusValues,
  type StockAdjustmentType,
  StockAdjustmentTypeValues,
} from '@/db/schema';
import { StockAdjustmentsLotsService } from '../../lots/services/stock-adjustments-lots.service';

@Injectable()
export class StockAdjustmentsRootService {
  private readonly logger = new Logger(StockAdjustmentsRootService.name);

  constructor(
    private readonly database: PrimaryDatabaseService,
    private readonly repository: StockAdjustmentsRepository,
    private readonly linesRepository: StockAdjustmentLinesRepository,
    private readonly lineItemsRepository: StockAdjustmentLineItemsRepository,
    private readonly lotsRepository: StockAdjustmentLotsRepository,
    private readonly lotsService: StockAdjustmentsLotsService,
    private readonly linesService: StockAdjustmentLinesService,
    private readonly batchesService: InventoryItemQuantsService,
    private readonly ledgerService: InventoryItemLedgerService,
    private readonly adjustmentsService: StockAdjustmentsService,
  ) {}

  table(state: TableViewState): Promise<{ result: StockAdjustmentDto[]; count: number }> {
    return this.adjustmentsService.findForTable(state);
  }

  findById(id: string): Promise<StockAdjustmentDto> {
    return this.adjustmentsService.findById(id);
  }

  create(data: {
    inventoryItemId: string;
    type: StockAdjustmentType;
    reason: string;
  }): Promise<CreateResponseDto<StockAdjustmentDto>> {
    return this.adjustmentsService.create(data);
  }

  delete(id: string): Promise<SuccessResponseDto> {
    return this.adjustmentsService.delete(id);
  }

  update(id: string, data: { reason?: string }): Promise<StockAdjustmentDto> {
    return this.adjustmentsService.updateAdjustment(id, data);
  }

  async publish(id: string): Promise<StockAdjustmentDto> {
    const adjustment = await this.repository.findByIdWithItem(id);
    if (!adjustment) throw new NotFoundException('Stock adjustment not found.');
    if (adjustment.status !== StockAdjustmentStatusValues.DRAFT) {
      throw new BadRequestException('Only DRAFT adjustments can be published.');
    }

    const linesCount = await this.linesRepository.countByAdjustmentId(id);
    if (linesCount === 0) {
      throw new BadRequestException('Cannot publish an adjustment with no lines.');
    }

    const tracking = adjustment.inventoryItemTracking;

    // For serial-bearing lines: validate balance (count of line_items === line.quantity)
    if (tracking === InventoryTrackingValues.SERIAL || tracking === InventoryTrackingValues.LOT_SERIAL) {
      const validation = await this.linesService.getPublishValidation(id);
      if (!validation.valid) {
        throw new BadRequestException(`Line items mismatch in ${validation.invalidLinesCount} line(s).`);
      }
    }

    const lines = await this.linesRepository.findByAdjustmentId(id);
    const allLineItems = await this.lineItemsRepository.findByAdjustmentId(id);
    const lineItemsByLineId = _.groupBy(allLineItems, (li) => li.stockAdjustmentLineId);

    const lots =
      adjustment.type === StockAdjustmentTypeValues.OPENING_STOCK &&
      (tracking === InventoryTrackingValues.LOT || tracking === InventoryTrackingValues.LOT_SERIAL)
        ? await this.lotsRepository.findByAdjustmentId(id)
        : [];

    if (lots.length > 0) {
      const existingLines = await this.linesRepository.findByAdjustmentId(id);
      const usedLotIds = new Set(existingLines.map((l) => l.stockAdjustmentLotId).filter(Boolean));
      const emptyLotCount = lots.filter((lot) => !usedLotIds.has(lot.id)).length;
      if (emptyLotCount > 0) {
        throw new BadRequestException(
          `${emptyLotCount} lot(s) have no lines. Remove them or add lines before publishing.`,
        );
      }
    }

    await this.database.runInTransaction(async () => {
      // Phase A: resolve lots (OPENING_STOCK, lot/item tracking) → create inventory_item_lots, set resolvedLotId
      for (const lot of lots) {
        await this.lotsService.resolveInventoryLot(adjustment.inventoryItemId, lot.id);
      }

      // Phase B: process each line
      for (const line of lines) {
        const lineItems = lineItemsByLineId[line.id] ?? [];
        if (adjustment.type === StockAdjustmentTypeValues.OPENING_STOCK) {
          await this.publishRegisterLine(id, adjustment, tracking, line, lineItems, lots);
        } else {
          await this.publishChangeLine(id, adjustment, tracking, line, lineItems);
        }
      }

      await this.repository.updateStatus(id, StockAdjustmentStatusValues.PUBLISHED, new Date());
    });

    this.logger.log(`Published adjustment ${id} (${adjustment.type}, ${linesCount} lines)`);
    return this.adjustmentsService.findById(id);
  }

  // OPENING_STOCK: line carries (locationId, lot draft FK if not 'quantity', quantity, [serials])
  private async publishRegisterLine(
    adjustmentId: string,
    adjustment: StockAdjustment & { inventoryItemName: string },
    tracking: InventoryTracking,
    line: StockAdjustmentLineWithRefs,
    lineItems: StockAdjustmentLineItem[],
    lots: StockAdjustmentLot[],
  ): Promise<void> {
    if (!line.locationId) {
      throw new BadRequestException(`Line ${line.id} is missing locationId for OPENING_STOCK.`);
    }

    // Convert the line quantity (in line.uomId) → primary UOM using the snapshot factor stored on
    // the line at create/update time. Serial tracking is restricted to primary UOM at validation
    // time, so factor === 1 in those branches by construction.
    const primaryQty = Number(line.quantity) * Number(line.conversionFactor);

    let createParams: Parameters<typeof this.batchesService.createBatchScoped>[0];
    if (tracking === InventoryTrackingValues.QUANTITY) {
      if (line.stockAdjustmentLotId) {
        throw new BadRequestException(`Line ${line.id}: lot must not be set for tracking=quantity.`);
      }
      createParams = {
        inventoryItemId: adjustment.inventoryItemId,
        locationId: line.locationId,
        tracking,
        quantity: primaryQty,
      };
    } else if (tracking === InventoryTrackingValues.SERIAL) {
      if (line.stockAdjustmentLotId) {
        throw new BadRequestException(`Line ${line.id}: lot must not be set for tracking=serial.`);
      }
      const serials = lineItems.map((li) => li.serialNumber);
      if (serials.length !== Number(line.quantity)) {
        throw new BadRequestException(
          `Line ${line.id}: expected ${line.quantity} serial numbers, got ${serials.length}.`,
        );
      }
      if (new Set(serials).size !== serials.length) {
        throw new BadRequestException(`Line ${line.id} has duplicate serial numbers.`);
      }
      createParams = {
        inventoryItemId: adjustment.inventoryItemId,
        locationId: line.locationId,
        tracking,
        quantity: serials.length,
        serialNumbers: serials,
      };
    } else {
      if (!line.stockAdjustmentLotId) {
        throw new BadRequestException(`Line ${line.id}: lot is required for tracking=${tracking}.`);
      }
      const lot = lots.find((l) => l.id === line.stockAdjustmentLotId);
      if (!lot) throw new BadRequestException(`Line ${line.id}: lot draft not found.`);

      if (tracking === InventoryTrackingValues.LOT) {
        createParams = {
          inventoryItemId: adjustment.inventoryItemId,
          locationId: line.locationId,
          tracking,
          quantity: primaryQty,
          lot: {
            lotNumber: lot.lotNumber,
            manufacturingDate: lot.manufacturingDate ?? null,
            expiryDate: lot.expiryDate ?? null,
          },
        };
      } else {
        // tracking === 'lot_serial'
        const serials = lineItems.map((li) => li.serialNumber);
        if (serials.length !== Number(line.quantity)) {
          throw new BadRequestException(
            `Line ${line.id}: expected ${line.quantity} serial numbers, got ${serials.length}.`,
          );
        }
        if (new Set(serials).size !== serials.length) {
          throw new BadRequestException(`Line ${line.id} has duplicate serial numbers.`);
        }
        createParams = {
          inventoryItemId: adjustment.inventoryItemId,
          locationId: line.locationId,
          tracking,
          quantity: serials.length,
          lot: {
            lotNumber: lot.lotNumber,
            manufacturingDate: lot.manufacturingDate ?? null,
            expiryDate: lot.expiryDate ?? null,
          },
          serialNumbers: serials,
        };
      }
    }

    const { quant } = await this.batchesService.createBatchScoped(createParams);

    await this.ledgerService.createEntry({
      inventoryItemId: adjustment.inventoryItemId,
      type: InventoryItemLedgerTypeValues.OPENING_STOCK,
      quantity: String(primaryQty),
      referenceType: InventoryItemLedgerReferenceTypeValues.STOCK_ADJUSTMENT,
      referenceId: adjustmentId,
      notes: adjustment.reason ?? null,
    });

    await this.linesRepository.setResolvedQuant(line.id, quant.id);
  }

  // Deduct/CORRECTION: line carries (quantId, quantity, [serials])
  private async publishChangeLine(
    adjustmentId: string,
    adjustment: StockAdjustment & { inventoryItemName: string },
    tracking: InventoryTracking,
    line: StockAdjustmentLineWithRefs,
    lineItems: StockAdjustmentLineItem[],
  ): Promise<void> {
    if (!line.quantId) {
      throw new BadRequestException(`Line ${line.id} is missing quantId for ${adjustment.type} adjustment.`);
    }

    let signedDelta: number;
    if (tracking === InventoryTrackingValues.SERIAL || tracking === InventoryTrackingValues.LOT_SERIAL) {
      const serials = lineItems.map((li) => li.serialNumber);
      if (serials.length !== Number(line.quantity)) {
        throw new BadRequestException(`Line ${line.id}: expected ${line.quantity} serials, got ${serials.length}.`);
      }
      await this.batchesService.adjustBatchScoped(line.quantId, { tracking, serials });
      signedDelta = this.isDeductType(adjustment.type) ? -serials.length : serials.length;
    } else {
      // Convert from line.uomId → primary UOM using the line's snapshot factor.
      const primaryQty = Number(line.quantity) * Number(line.conversionFactor);
      const delta = this.isDeductType(adjustment.type) ? -Math.abs(primaryQty) : primaryQty;
      await this.batchesService.adjustBatchScoped(line.quantId, { tracking, delta });
      signedDelta = delta;
    }

    await this.ledgerService.createEntry({
      inventoryItemId: adjustment.inventoryItemId,
      type: InventoryItemLedgerTypeValues.ADJUSTMENT,
      quantity: String(signedDelta),
      referenceType: InventoryItemLedgerReferenceTypeValues.STOCK_ADJUSTMENT,
      referenceId: adjustmentId,
      notes: `${adjustment.type}: ${adjustment.reason ?? ''}`,
    });

    await this.linesRepository.setResolvedQuant(line.id, line.quantId);
  }

  private isDeductType(type: StockAdjustmentType): boolean {
    return (
      [
        StockAdjustmentTypeValues.WASTE,
        StockAdjustmentTypeValues.DAMAGE,
        StockAdjustmentTypeValues.THEFT,
        StockAdjustmentTypeValues.EXPIRED,
      ] as readonly StockAdjustmentType[]
    ).includes(type);
  }
}
