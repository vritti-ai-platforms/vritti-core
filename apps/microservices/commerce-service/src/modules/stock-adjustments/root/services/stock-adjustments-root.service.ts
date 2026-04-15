import { InventoryItemBatchesService } from '@domain/inventory-item-batches/services/inventory-item-batches.service';
import { InventoryLedgerService } from '@domain/inventory-ledger/services/inventory-ledger.service';
import { StockAdjustmentLineItemsService } from '@domain/stock-adjustment-line-items/services/stock-adjustment-line-items.service';
import { StockAdjustmentLinesRepository } from '@domain/stock-adjustment-lines/repositories/stock-adjustment-lines.repository';
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
import {
  InventoryLedgerReferenceTypeValues,
  InventoryLedgerTypeValues,
  StockAdjustmentStatusValues,
  type StockAdjustment,
  type StockAdjustmentType,
  StockAdjustmentTypeValues,
} from '@/db/schema';

@Injectable()
export class StockAdjustmentsRootService {
  private readonly logger = new Logger(StockAdjustmentsRootService.name);

  constructor(
    private readonly repository: StockAdjustmentsRepository,
    private readonly linesRepository: StockAdjustmentLinesRepository,
    private readonly lineItemsService: StockAdjustmentLineItemsService,
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

  create(
    data: { inventoryItemId: string; type: StockAdjustmentType; reason: string; createdById: string },
  ): Promise<CreateResponseDto<StockAdjustmentDto>> {
    return this.adjustmentsService.create(data);
  }

  delete(id: string): Promise<SuccessResponseDto> {
    return this.adjustmentsService.delete(id);
  }

  async publish(id: string): Promise<StockAdjustmentDto> {
    const adjustment = await this.repository.findByIdWithItemName(id);
    if (!adjustment) throw new NotFoundException('Stock adjustment not found.');
    if (adjustment.status !== StockAdjustmentStatusValues.DRAFT) {
      throw new BadRequestException('Only DRAFT adjustments can be published.');
    }

    const lines = await this.linesRepository.findByAdjustmentId(id);
    if (lines.length === 0) {
      throw new BadRequestException('Cannot publish an adjustment with no lines.');
    }

    const validation = await this.lineItemsService.getPublishValidation(id);
    if (!validation.valid) {
      const detail = validation.errors
        .map(
          (error) =>
            `[line=${error.lineId}] lineQty=${error.lineQuantity}, itemsCount=${error.lineItemsCount}, itemsSum=${error.lineItemsQuantitySum}, delta=${error.delta}`,
        )
        .join('; ');
      throw new BadRequestException(`Line items mismatch. ${detail}`);
    }

    await this.repository.transaction(async (tx) => {
      for (const line of lines) {
        if (adjustment.type === StockAdjustmentTypeValues.OPENING_STOCK) {
          await this.publishOpeningLine(tx, id, adjustment, line);
        } else {
          await this.publishNonOpeningLine(tx, id, adjustment, line);
        }
      }

      await this.repository.updateStatusInTx(tx, id, StockAdjustmentStatusValues.PUBLISHED, new Date());
    });

    this.logger.log(`Published adjustment ${id} (${adjustment.type}, ${lines.length} lines)`);
    return this.adjustmentsService.findById(id);
  }

  private async publishOpeningLine(
    tx: TypedDrizzleClient,
    adjustmentId: string,
    adjustment: StockAdjustment & { inventoryItemName: string; createdByFullName: string },
    line: {
      id: string;
      locationId: string | null;
      quantity: string;
      manufacturingDate: string | null;
      expiryDate: string | null;
    },
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
    line: { id: string; batchId: string | null; quantity: string },
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
        StockAdjustmentTypeValues.PRODUCTION,
      ] as readonly StockAdjustmentType[]
    ).includes(type);
  }
}
