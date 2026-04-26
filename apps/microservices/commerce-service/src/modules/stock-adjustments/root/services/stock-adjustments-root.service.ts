import { InventoryItemQuantsService } from '@domain/inventory-item-quants/services/inventory-item-quants.service';
import { InventoryLedgerService } from '@domain/inventory-ledger/services/inventory-ledger.service';
import { StockAdjustmentLineItemsRepository } from '@domain/stock-adjustment-line-items/repositories/stock-adjustment-line-items.repository';
import type { StockAdjustmentLineWithRefs } from '@domain/stock-adjustment-lines/repositories/stock-adjustment-lines.repository';
import { StockAdjustmentLinesRepository } from '@domain/stock-adjustment-lines/repositories/stock-adjustment-lines.repository';
import { StockAdjustmentLinesService } from '@domain/stock-adjustment-lines/services/stock-adjustment-lines.service';
import { StockAdjustmentLotsRepository } from '@domain/stock-adjustment-lots/repositories/stock-adjustment-lots.repository';
import { StockAdjustmentLotsService } from '@domain/stock-adjustment-lots/services/stock-adjustment-lots.service';
import { type StockAdjustmentDto } from '@domain/stock-adjustments/dto/entity/stock-adjustment.dto';
import { StockAdjustmentsRepository } from '@domain/stock-adjustments/repositories/stock-adjustments.repository';
import { StockAdjustmentsService } from '@domain/stock-adjustments/services/stock-adjustments.service';
import { Injectable, Logger } from '@nestjs/common';
import {
  BadRequestException,
  type CreateResponseDto,
  NotFoundException,
  type SuccessResponseDto,
  type TableViewState,
  type TypedDrizzleClient,
} from '@vritti/api-sdk';
import _ from '@vritti/api-sdk/lodash';
import {
  InventoryLedgerReferenceTypeValues,
  InventoryLedgerTypeValues,
  type InventoryTracking,
  InventoryTrackingValues,
  type StockAdjustment,
  type StockAdjustmentLineItem,
  type StockAdjustmentLot,
  StockAdjustmentStatusValues,
  type StockAdjustmentType,
  StockAdjustmentTypeValues,
} from '@/db/schema';

@Injectable()
export class StockAdjustmentsRootService {
  private readonly logger = new Logger(StockAdjustmentsRootService.name);

  constructor(
    private readonly repository: StockAdjustmentsRepository,
    private readonly linesRepository: StockAdjustmentLinesRepository,
    private readonly lineItemsRepository: StockAdjustmentLineItemsRepository,
    private readonly lotsRepository: StockAdjustmentLotsRepository,
    private readonly lotsService: StockAdjustmentLotsService,
    private readonly linesService: StockAdjustmentLinesService,
    private readonly batchesService: InventoryItemQuantsService,
    private readonly ledgerService: InventoryLedgerService,
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
    createdById: string;
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
    const adjustment = await this.repository.findByIdWithItemName(id);
    if (!adjustment) throw new NotFoundException('Stock adjustment not found.');
    if (adjustment.status !== StockAdjustmentStatusValues.DRAFT) {
      throw new BadRequestException('Only DRAFT adjustments can be published.');
    }

    const linesCount = await this.linesRepository.countByAdjustmentId(id);
    if (linesCount === 0) {
      throw new BadRequestException('Cannot publish an adjustment with no lines.');
    }

    const tracking = adjustment.inventoryItemTracking;

    // For tracking='serial' lines: validate balance (count of line_items === line.quantity)
    if (tracking === InventoryTrackingValues.SERIAL) {
      const validation = await this.linesService.getPublishValidation(id);
      if (!validation.valid) {
        throw new BadRequestException(`Line items mismatch in ${validation.invalidLinesCount} line(s).`);
      }
    }

    const lines = await this.linesRepository.findByAdjustmentId(id);
    const allLineItems = await this.lineItemsRepository.findByAdjustmentId(id);
    const lineItemsByLineId = _.groupBy(allLineItems, (li) => li.stockAdjustmentLineId);

    const lots =
      adjustment.type === StockAdjustmentTypeValues.OPENING_STOCK && tracking !== InventoryTrackingValues.QUANTITY
        ? await this.lotsRepository.findByAdjustmentId(id)
        : [];

    await this.repository.transaction(async (tx) => {
      // Phase A: resolve lots (OPENING_STOCK, lot/item tracking) → create inventory_item_lots, set resolvedLotId
      const resolvedLotByDraftId = new Map<string, string>();
      for (const lot of lots) {
        const inventoryLot = await this.lotsService.resolveInventoryLotInTx(tx, adjustment.inventoryItemId, lot.id);
        resolvedLotByDraftId.set(lot.id, inventoryLot.id);
      }

      // Phase B: process each line
      for (const line of lines) {
        const lineItems = lineItemsByLineId[line.id] ?? [];
        if (adjustment.type === StockAdjustmentTypeValues.OPENING_STOCK) {
          await this.publishRegisterLine(tx, id, adjustment, tracking, line, lineItems, lots);
        } else {
          await this.publishChangeLine(tx, id, adjustment, tracking, line, lineItems);
        }
      }

      await this.repository.updateStatusInTx(tx, id, StockAdjustmentStatusValues.PUBLISHED, new Date());
    });

    this.logger.log(`Published adjustment ${id} (${adjustment.type}, ${linesCount} lines)`);
    return this.adjustmentsService.findById(id);
  }

  // OPENING_STOCK: line carries (locationId, lot draft FK if not 'quantity', quantity, [serials])
  private async publishRegisterLine(
    tx: TypedDrizzleClient,
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

    let createParams: Parameters<typeof this.batchesService.createBatchInTx>[1];
    if (tracking === InventoryTrackingValues.QUANTITY) {
      if (line.stockAdjustmentLotId) {
        throw new BadRequestException(`Line ${line.id}: lot must not be set for tracking=quantity.`);
      }
      createParams = {
        inventoryItemId: adjustment.inventoryItemId,
        locationId: line.locationId,
        tracking,
        quantity: Number(line.quantity),
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
          quantity: Number(line.quantity),
          lot: {
            lotNumber: lot.lotNumber,
            manufacturingDate: lot.manufacturingDate ?? null,
            expiryDate: lot.expiryDate ?? null,
          },
        };
      } else {
        // tracking === 'serial'
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

    const { quant } = await this.batchesService.createBatchInTx(tx, createParams);

    await this.ledgerService.createEntryInTx(tx, {
      inventoryItemId: adjustment.inventoryItemId,
      batchId: quant.id,
      type: InventoryLedgerTypeValues.OPENING_STOCK,
      quantity: line.quantity,
      referenceType: InventoryLedgerReferenceTypeValues.STOCK_ADJUSTMENT,
      referenceId: adjustmentId,
      notes: adjustment.reason ?? null,
    });

    await this.linesRepository.setResolvedQuantInTx(tx, line.id, quant.id);
  }

  // Deduct/CORRECTION: line carries (quantId, quantity, [serials])
  private async publishChangeLine(
    tx: TypedDrizzleClient,
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
    if (tracking === InventoryTrackingValues.SERIAL) {
      const serials = lineItems.map((li) => li.serialNumber);
      if (serials.length !== Number(line.quantity)) {
        throw new BadRequestException(`Line ${line.id}: expected ${line.quantity} serials, got ${serials.length}.`);
      }
      await this.batchesService.adjustBatchInTx(tx, line.quantId, { tracking, serials });
      signedDelta = this.isDeductType(adjustment.type) ? -serials.length : serials.length;
    } else {
      const delta = this.isDeductType(adjustment.type) ? -Math.abs(Number(line.quantity)) : Number(line.quantity);
      await this.batchesService.adjustBatchInTx(tx, line.quantId, { tracking, delta });
      signedDelta = delta;
    }

    await this.ledgerService.createEntryInTx(tx, {
      inventoryItemId: adjustment.inventoryItemId,
      batchId: line.quantId,
      type: InventoryLedgerTypeValues.ADJUSTMENT,
      quantity: String(signedDelta),
      referenceType: InventoryLedgerReferenceTypeValues.STOCK_ADJUSTMENT,
      referenceId: adjustmentId,
      notes: `${adjustment.type}: ${adjustment.reason ?? ''}`,
    });

    await this.linesRepository.setResolvedQuantInTx(tx, line.id, line.quantId);
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
