import { InventoryItemBatchesService } from '@domain/inventory-item-batches/services/inventory-item-batches.service';
import { InventoryLedgerService } from '@domain/inventory-ledger/services/inventory-ledger.service';
import { StockAdjustmentLineItemsRepository } from '@domain/stock-adjustment-line-items/repositories/stock-adjustment-line-items.repository';
import { StockAdjustmentLinesRepository } from '@domain/stock-adjustment-lines/repositories/stock-adjustment-lines.repository';
import { StockAdjustmentLinesService } from '@domain/stock-adjustment-lines/services/stock-adjustment-lines.service';
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
  type StockAdjustment,
  type StockAdjustmentLine,
  type StockAdjustmentLineItem,
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
    private readonly linesService: StockAdjustmentLinesService,
    private readonly batchesService: InventoryItemBatchesService,
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
    quantity: number;
    reason: string;
    createdById: string;
  }): Promise<CreateResponseDto<StockAdjustmentDto>> {
    return this.adjustmentsService.create(data);
  }

  delete(id: string): Promise<SuccessResponseDto> {
    return this.adjustmentsService.delete(id);
  }

  update(id: string, data: { quantity: number }): Promise<StockAdjustmentDto> {
    return this.adjustmentsService.updateQuantity(id, data.quantity);
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
    const totalLinesQuantity = await this.linesRepository.totalQuantityForAdjustment(id);
    if (!this.areEqualToScale(totalLinesQuantity, Number(adjustment.quantity))) {
      throw new BadRequestException('Line quantity total must equal adjustment quantity before publish.');
    }

    const validation = await this.linesService.getPublishValidation(id);
    if (!validation.valid) {
      throw new BadRequestException(`Line items mismatch in ${validation.invalidLinesCount} line(s).`);
    }

    const lines = await this.linesRepository.findByAdjustmentId(id);
    const adjustmentLineItems = await this.lineItemsRepository.findByAdjustmentId(id);
    const lineItemsByLineId = _.groupBy(adjustmentLineItems, (lineItem) => lineItem.stockAdjustmentLineId);

    await this.repository.transaction(async (tx) => {
      for (const line of lines) {
        if (adjustment.type === StockAdjustmentTypeValues.OPENING_STOCK) {
          const lineItems = lineItemsByLineId[line.id];
          if (!lineItems) {
            throw new BadRequestException(`Line ${line.id} has no line items for publish.`);
          }
          await this.publishOpeningLine(tx, id, adjustment, line, lineItems);
        } else {
          await this.publishNonOpeningLine(tx, id, adjustment, line);
        }
      }

      await this.repository.updateStatusInTx(tx, id, StockAdjustmentStatusValues.PUBLISHED, new Date());
    });

    this.logger.log(`Published adjustment ${id} (${adjustment.type}, ${linesCount} lines)`);
    return this.adjustmentsService.findById(id);
  }

  private async publishOpeningLine(
    tx: TypedDrizzleClient,
    adjustmentId: string,
    adjustment: StockAdjustment & { inventoryItemName: string; createdByFullName: string },
    line: StockAdjustmentLine,
    lineItems: StockAdjustmentLineItem[],
  ): Promise<void> {
    if (!line.locationId) {
      throw new BadRequestException(`Line ${line.id} is missing locationId for OPENING_STOCK adjustment.`);
    }

    const batch = await this.batchesService.createBatchInTx(tx, {
      inventoryItemId: adjustment.inventoryItemId,
      locationId: line.locationId,
      quantity: Number(line.quantity),
      manufacturingDate: line.manufacturingDate ?? undefined,
      expiryDate: line.expiryDate ?? undefined,
    });

    if (!batch.batchNumber) {
      throw new BadRequestException(`Batch number generation failed for line ${line.id}.`);
    }

    if (lineItems.length === 0) {
      throw new BadRequestException('Cannot publish opening stock line with no line items.');
    }

    const totalLineItemsQuantity = lineItems.reduce((sum, lineItem) => sum + Number(lineItem.quantity), 0);
    await this.batchesService.upsertBatchItemWithTx(tx, {
      inventoryItemBatchId: batch.id,
      inventoryItemId: adjustment.inventoryItemId,
      quantity: String(totalLineItemsQuantity),
    });

    await this.ledgerService.createEntryInTx(tx, {
      inventoryItemId: adjustment.inventoryItemId,
      batchId: batch.id,
      type: InventoryLedgerTypeValues.OPENING_STOCK,
      quantity: line.quantity,
      referenceType: InventoryLedgerReferenceTypeValues.STOCK_ADJUSTMENT,
      referenceId: adjustmentId,
      notes: adjustment.reason ?? null,
    });

    await this.linesRepository.updateLineWithBatchInTx(tx, line.id, batch.id, batch.batchNumber);
  }

  private async publishNonOpeningLine(
    tx: TypedDrizzleClient,
    adjustmentId: string,
    adjustment: StockAdjustment & { inventoryItemName: string; createdByFullName: string },
    line: StockAdjustmentLine,
  ): Promise<void> {
    if (!line.batchId) {
      throw new BadRequestException(`Line ${line.id} is missing batchId for ${adjustment.type} adjustment.`);
    }

    const delta = this.isDeductType(adjustment.type) ? -Math.abs(Number(line.quantity)) : Number(line.quantity);

    await this.batchesService.adjustBatchInTx(tx, line.batchId, delta);

    await this.ledgerService.createEntryInTx(tx, {
      inventoryItemId: adjustment.inventoryItemId,
      batchId: line.batchId,
      type: InventoryLedgerTypeValues.ADJUSTMENT,
      quantity: String(delta),
      referenceType: InventoryLedgerReferenceTypeValues.STOCK_ADJUSTMENT,
      referenceId: adjustmentId,
      notes: `${adjustment.type}: ${adjustment.reason ?? ''}`,
    });
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

  private areEqualToScale(a: number, b: number): boolean {
    return Math.round(a * 1000) === Math.round(b * 1000);
  }
}
