import { InventoryItemLedgerService } from '@domain/inventory-item-ledger/services/inventory-item-ledger.service';
import { InventoryItemQuantsRepository } from '@domain/inventory-item-quants/repositories/inventory-item-quants.repository';
import {
  type CreateQuantParams,
  InventoryItemQuantsService,
} from '@domain/inventory-item-quants/services/inventory-item-quants.service';
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
import Decimal from '@vritti/api-sdk/decimal';
import _ from '@vritti/api-sdk/lodash';
import {
  CostSourceTypeValues,
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
    private readonly quantsRepository: InventoryItemQuantsRepository,
    private readonly ledgerService: InventoryItemLedgerService,
    private readonly adjustmentsService: StockAdjustmentsService,
  ) {}

  table(state: TableViewState, buCurrencyCode?: string): Promise<{ result: StockAdjustmentDto[]; count: number }> {
    return this.adjustmentsService.findForTable(state, buCurrencyCode);
  }

  findById(id: string, buCurrencyCode?: string): Promise<StockAdjustmentDto> {
    return this.adjustmentsService.findById(id, buCurrencyCode);
  }

  create(data: {
    inventoryItemId: string;
    type: StockAdjustmentType;
    reason: string;
    unitCost?: bigint | null;
  }): Promise<CreateResponseDto<StockAdjustmentDto>> {
    return this.adjustmentsService.create(data);
  }

  delete(id: string): Promise<SuccessResponseDto> {
    return this.adjustmentsService.delete(id);
  }

  update(
    id: string,
    data: { reason?: string; unitCost?: bigint | null },
    buCurrencyCode?: string,
  ): Promise<StockAdjustmentDto> {
    return this.adjustmentsService.updateAdjustment(id, data, buCurrencyCode);
  }

  async publish(id: string, buCurrencyCode: string): Promise<StockAdjustmentDto> {
    const adjustment = await this.repository.findByIdWithItem(id);
    if (!adjustment) throw new NotFoundException('Stock adjustment not found.');
    if (adjustment.status !== StockAdjustmentStatusValues.DRAFT) {
      throw new BadRequestException('Only DRAFT adjustments can be published.');
    }

    const unitCostMinor = adjustment.unitCost == null ? null : BigInt(adjustment.unitCost as unknown as string);
    if (adjustment.type === StockAdjustmentTypeValues.OPENING_STOCK && (unitCostMinor == null || unitCostMinor <= 0n)) {
      throw new BadRequestException('Opening stock requires a unit cost before publishing.');
    }

    const linesCount = await this.linesRepository.countByAdjustmentId(id);
    if (linesCount === 0) {
      throw new BadRequestException('Cannot publish an adjustment with no lines.');
    }

    const tracking = adjustment.inventoryItemTracking;

    // For serial-bearing lines: validate balance (count of line_items === line.uomQty)
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

      // Re-fetch lots after Phase A so each draft carries its now-populated `resolvedLotId`. The
      // publishRegisterLine path creates quants that expect a pre-resolved lot id, so we can't rely
      // on the stale snapshot taken before Phase A.
      const resolvedLots =
        adjustment.type === StockAdjustmentTypeValues.OPENING_STOCK &&
        (tracking === InventoryTrackingValues.LOT || tracking === InventoryTrackingValues.LOT_SERIAL)
          ? await this.lotsRepository.findByAdjustmentId(id)
          : lots;

      // Phase B: process each line
      for (const line of lines) {
        const lineItems = lineItemsByLineId[line.id] ?? [];
        if (adjustment.type === StockAdjustmentTypeValues.OPENING_STOCK) {
          // unitCostMinor is non-null for OPENING_STOCK (validated above).
          await this.publishRegisterLine(
            id,
            adjustment,
            tracking,
            line,
            lineItems,
            resolvedLots,
            buCurrencyCode,
            unitCostMinor as bigint,
          );
        } else {
          await this.publishChangeLine(id, adjustment, tracking, line, lineItems);
        }
      }

      await this.repository.updateStatus(id, StockAdjustmentStatusValues.PUBLISHED, new Date());
    });

    this.logger.log(`Published adjustment ${id} (${adjustment.type}, ${linesCount} lines)`);
    return this.adjustmentsService.findById(id, buCurrencyCode);
  }

  // OPENING_STOCK: line carries (locationId, lot draft FK if not 'quantity', quantity, [serials]).
  // The entered unit cost is set on the quant at creation, so opening stock is valued immediately.
  private async publishRegisterLine(
    adjustmentId: string,
    adjustment: StockAdjustment & { inventoryItemName: string },
    tracking: InventoryTracking,
    line: StockAdjustmentLineWithRefs,
    lineItems: StockAdjustmentLineItem[],
    lots: StockAdjustmentLot[],
    buCurrencyCode: string,
    unitCost: bigint,
  ): Promise<void> {
    if (!line.locationId) {
      throw new BadRequestException(`Line ${line.id} is missing locationId for OPENING_STOCK.`);
    }

    // Snapshot of the line quantity in the item's primary UOM, computed at create/update time.
    // Serial tracking is restricted to primary UOM at validation time, so primaryUomQty === uomQty
    // in those branches by construction.
    const primaryUomQty = line.primaryUomQty;

    const costProvenance = {
      unitCost,
      costCurrency: buCurrencyCode,
      sourceType: CostSourceTypeValues.STOCK_ADJUSTMENT,
      sourceId: adjustmentId,
    };

    let createParams: CreateQuantParams;
    if (tracking === InventoryTrackingValues.QUANTITY) {
      if (line.stockAdjustmentLotId) {
        throw new BadRequestException(`Line ${line.id}: lot must not be set for tracking=quantity.`);
      }
      createParams = {
        inventoryItemId: adjustment.inventoryItemId,
        locationId: line.locationId,
        tracking,
        quantity: primaryUomQty,
        ...costProvenance,
      };
    } else if (tracking === InventoryTrackingValues.SERIAL) {
      if (line.stockAdjustmentLotId) {
        throw new BadRequestException(`Line ${line.id}: lot must not be set for tracking=serial.`);
      }
      const serials = lineItems.map((li) => li.serialNumber);
      if (serials.length !== line.uomQty) {
        throw new BadRequestException(
          `Line ${line.id}: expected ${line.uomQty} serial numbers, got ${serials.length}.`,
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
        ...costProvenance,
      };
    } else {
      if (!line.stockAdjustmentLotId) {
        throw new BadRequestException(`Line ${line.id}: lot is required for tracking=${tracking}.`);
      }
      const lot = lots.find((l) => l.id === line.stockAdjustmentLotId);
      if (!lot) throw new BadRequestException(`Line ${line.id}: lot draft not found.`);
      // Phase A resolved each SA lot draft into an inventory_item_lots row and stamped its id
      // onto `resolved_lot_id`. createQuantScoped requires that resolved id.
      if (!lot.resolvedLotId) {
        throw new BadRequestException(`Line ${line.id}: lot draft is missing resolvedLotId (Phase A skipped).`);
      }

      if (tracking === InventoryTrackingValues.LOT) {
        createParams = {
          inventoryItemId: adjustment.inventoryItemId,
          locationId: line.locationId,
          tracking,
          quantity: primaryUomQty,
          lotId: lot.resolvedLotId,
          ...costProvenance,
        };
      } else {
        // tracking === 'lot_serial'
        const serials = lineItems.map((li) => li.serialNumber);
        if (serials.length !== line.uomQty) {
          throw new BadRequestException(
            `Line ${line.id}: expected ${line.uomQty} serial numbers, got ${serials.length}.`,
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
          lotId: lot.resolvedLotId,
          serialNumbers: serials,
          ...costProvenance,
        };
      }
    }

    const { quant } = await this.batchesService.createQuantScoped(createParams);

    await this.ledgerService.createEntry({
      inventoryItemId: adjustment.inventoryItemId,
      type: InventoryItemLedgerTypeValues.OPENING_STOCK,
      quantity: primaryUomQty,
      referenceType: InventoryItemLedgerReferenceTypeValues.STOCK_ADJUSTMENT,
      referenceId: adjustmentId,
      notes: adjustment.reason ?? null,
    });

    await this.linesRepository.setResolvedQuant(line.id, quant.id);
  }

  // Deduct/CORRECTION: line carries (quantId, quantity, [serials]).
  // PR4: for deduct types (WASTE/DAMAGE/THEFT/EXPIRED) and negative CORRECTIONs we snapshot
  // `write_off_amount = sourceQuant.unit_cost × primaryUomQty` plus `write_off_currency`
  // onto the SA line so loss reporting + period-end queries don't have to re-join the quant's
  // cost history. The snapshot is taken BEFORE the decrement (the quant value is unchanged at
  // that moment).
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

    const isDeduct = this.isDeductType(adjustment.type);
    let signedDelta: number;
    let writeOffPrimaryUomQty = 0;

    if (tracking === InventoryTrackingValues.SERIAL || tracking === InventoryTrackingValues.LOT_SERIAL) {
      const serials = lineItems.map((li) => li.serialNumber);
      if (serials.length !== line.uomQty) {
        throw new BadRequestException(`Line ${line.id}: expected ${line.uomQty} serials, got ${serials.length}.`);
      }
      writeOffPrimaryUomQty = serials.length;
      // Take the write-off snapshot before consuming the serials.
      if (isDeduct) await this.snapshotWriteOff(line, writeOffPrimaryUomQty);
      await this.batchesService.adjustQuantScoped(line.quantId, { tracking, serials });
      signedDelta = isDeduct ? -serials.length : serials.length;
    } else {
      // Snapshot of line qty in the item's primary UOM, computed at create/update time.
      const primaryUomQty = line.primaryUomQty;
      const delta = isDeduct ? -Math.abs(primaryUomQty) : primaryUomQty;
      writeOffPrimaryUomQty = Math.abs(delta);
      if (isDeduct) await this.snapshotWriteOff(line, writeOffPrimaryUomQty);
      await this.batchesService.adjustQuantScoped(line.quantId, { tracking, delta });
      signedDelta = delta;
    }

    await this.ledgerService.createEntry({
      inventoryItemId: adjustment.inventoryItemId,
      type: InventoryItemLedgerTypeValues.ADJUSTMENT,
      quantity: signedDelta,
      referenceType: InventoryItemLedgerReferenceTypeValues.STOCK_ADJUSTMENT,
      referenceId: adjustmentId,
      notes: `${adjustment.type}: ${adjustment.reason ?? ''}`,
    });

    await this.linesRepository.setResolvedQuant(line.id, line.quantId);
  }

  // PR4: reads the source quant's denormalized unit_cost + cost_currency and snapshots
  // `unit_cost × primaryUomQty` onto the SA line. Cheap because quant.unit_cost is
  // already denormalized — no cost-row roll-up needed at write-off time.
  private async snapshotWriteOff(line: StockAdjustmentLineWithRefs, primaryUomQty: number): Promise<void> {
    if (!line.quantId) return;
    const sourceQuant = await this.quantsRepository.findById(line.quantId);
    if (!sourceQuant) return;
    const unitCost = BigInt(sourceQuant.unitCost?.toString() ?? '0');
    if (unitCost === 0n || primaryUomQty <= 0) return;
    const writeOffAmount = BigInt(
      new Decimal(unitCost.toString()).times(primaryUomQty).toDecimalPlaces(0, Decimal.ROUND_HALF_UP).toFixed(0),
    );
    const currency = sourceQuant.costCurrency ?? '';
    if (!currency) return;
    await this.linesRepository.setWriteOff(line.id, writeOffAmount, currency);
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
