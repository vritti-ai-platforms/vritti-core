import { GoodsReceiptLineItemsRepository } from '@domain/goods-receipt-line-items/repositories/goods-receipt-line-items.repository';
import { GoodsReceiptLinesRepository } from '@domain/goods-receipt-lines/repositories/goods-receipt-lines.repository';
import { GoodsReceiptLotsRepository } from '@domain/goods-receipt-lots/repositories/goods-receipt-lots.repository';
import { GoodsReceiptDto } from '@domain/goods-receipts/dto/entity/goods-receipt.dto';
import { GoodsReceiptItemsRepository } from '@domain/goods-receipts/repositories/goods-receipt-items.repository';
import { GoodsReceiptsRepository } from '@domain/goods-receipts/repositories/goods-receipts.repository';
import { GoodsReceiptsService } from '@domain/goods-receipts/services/goods-receipts.service';
import { InventoryItemQuantsService } from '@domain/inventory-item-quants/services/inventory-item-quants.service';
import { InventoryLedgerService } from '@domain/inventory-ledger/services/inventory-ledger.service';
import { PurchaseOrderItemsRepository } from '@domain/purchase-orders/repositories/purchase-order-items.repository';
import { Injectable } from '@nestjs/common';
import { BadRequestException, NotFoundException, PrimaryDatabaseService } from '@vritti/api-sdk';
import {
  GoodsReceiptStatusValues,
  InventoryLedgerReferenceTypeValues,
  InventoryLedgerTypeValues,
  InventoryTrackingValues,
  PurchaseOrderStatusValues,
} from '@/db/schema';

@Injectable()
export class GoodsReceiptsPublishService {
  constructor(
    private readonly database: PrimaryDatabaseService,
    private readonly receiptsRepository: GoodsReceiptsRepository,
    private readonly itemsRepository: GoodsReceiptItemsRepository,
    private readonly lotsRepository: GoodsReceiptLotsRepository,
    private readonly linesRepository: GoodsReceiptLinesRepository,
    private readonly lineItemsRepository: GoodsReceiptLineItemsRepository,
    private readonly poItemsRepository: PurchaseOrderItemsRepository,
    private readonly quantsService: InventoryItemQuantsService,
    private readonly ledgerService: InventoryLedgerService,
    private readonly receiptsService: GoodsReceiptsService,
  ) {}

  async publish(id: string): Promise<GoodsReceiptDto> {
    const receipt = await this.receiptsRepository.findByIdWithRefs(id);
    if (!receipt) throw new NotFoundException('Goods receipt not found.');
    if (receipt.status !== GoodsReceiptStatusValues.DRAFT) {
      throw new BadRequestException('Only DRAFT goods receipts can be published.');
    }

    const items = await this.itemsRepository.findByReceiptIdForPublish(id);
    if (items.length === 0) throw new BadRequestException('Cannot publish a goods receipt with no items.');

    // Pre-flight: every serial-tracked line must be balanced (line_items count == quantity)
    const unbalanced = await this.linesRepository.findUnbalancedSerialLines(id);
    if (unbalanced.length > 0) {
      throw new BadRequestException(
        `Cannot publish: ${unbalanced.length} serial-tracked line(s) have a serial count mismatch.`,
      );
    }

    await this.database.runInTransaction(async () => {
      for (const item of items) {
        const lines = await this.linesRepository.findByItemId(item.id);

        // For tracking='quantity': require at least one line; total > 0
        // For tracking='lot' or 'serial': lines also must reference a lot under this item
        let acceptedTotal = 0;

        for (const line of lines) {
          const lineQuantity = Number(line.quantity);
          const isSerialBearing =
            item.tracking === InventoryTrackingValues.SERIAL || item.tracking === InventoryTrackingValues.LOT_SERIAL;
          const requiresLot =
            item.tracking === InventoryTrackingValues.LOT || item.tracking === InventoryTrackingValues.LOT_SERIAL;

          if (lineQuantity <= 0 && !isSerialBearing) {
            throw new BadRequestException(`Line ${line.id} has zero quantity.`);
          }
          if (requiresLot && !line.goodsReceiptLotId) {
            throw new BadRequestException(`Line ${line.id} requires a lot for tracking=${item.tracking}.`);
          }

          const lotInfo =
            requiresLot && line.lotNumber
              ? (() => {
                  if (!line.lotExpiryDate) {
                    throw new BadRequestException(`Line ${line.id} lot is missing expiry date.`);
                  }
                  return {
                    lotNumber: line.lotNumber,
                    manufacturingDate: line.lotManufacturingDate ?? null,
                    expiryDate: line.lotExpiryDate,
                  };
                })()
              : undefined;

          const serials = isSerialBearing
            ? (await this.lineItemsRepository.findByLineId(line.id)).map((li) => li.serialNumber)
            : undefined;

          if (isSerialBearing && serials && serials.length === 0) {
            throw new BadRequestException(`Line ${line.id} has no serials.`);
          }

          let createParams: Parameters<typeof this.quantsService.createBatchScoped>[0];
          if (item.tracking === InventoryTrackingValues.QUANTITY) {
            createParams = {
              inventoryItemId: item.inventoryItemId,
              locationId: line.locationId,
              tracking: InventoryTrackingValues.QUANTITY,
              quantity: lineQuantity,
            };
          } else if (item.tracking === InventoryTrackingValues.LOT) {
            createParams = {
              inventoryItemId: item.inventoryItemId,
              locationId: line.locationId,
              tracking: InventoryTrackingValues.LOT,
              quantity: lineQuantity,
              lot: lotInfo!,
            };
          } else if (item.tracking === InventoryTrackingValues.SERIAL) {
            createParams = {
              inventoryItemId: item.inventoryItemId,
              locationId: line.locationId,
              tracking: InventoryTrackingValues.SERIAL,
              quantity: lineQuantity,
              serialNumbers: serials!,
            };
          } else {
            createParams = {
              inventoryItemId: item.inventoryItemId,
              locationId: line.locationId,
              tracking: InventoryTrackingValues.LOT_SERIAL,
              quantity: lineQuantity,
              lot: lotInfo!,
              serialNumbers: serials!,
            };
          }

          const { quant, lot: createdLot } = await this.quantsService.createBatchScoped(createParams);
          await this.linesRepository.setResolvedQuant(line.id, quant.id);
          if (createdLot && line.goodsReceiptLotId) {
            await this.lotsRepository.setResolvedLotId(line.goodsReceiptLotId, createdLot.id);
          }

          await this.ledgerService.createEntry({
            inventoryItemId: item.inventoryItemId,
            batchId: quant.id,
            type: InventoryLedgerTypeValues.GOODS_RECEIPT,
            quantity: String(lineQuantity),
            referenceType: InventoryLedgerReferenceTypeValues.GOODS_RECEIPT,
            referenceId: receipt.id,
            notes: receipt.notes ?? null,
          });

          acceptedTotal += lineQuantity;
        }

        // PO cap re-check at publish time + bump receivedQuantity on the linked PO item
        if (receipt.purchaseOrderId && item.poItemId) {
          const ordered = Number(item.poOrderedQuantity ?? 0);
          const received = Number(item.poReceivedQuantity ?? 0);
          if (this.toScaled(received + acceptedTotal) > this.toScaled(ordered)) {
            throw new BadRequestException(
              `Accepted quantity ${acceptedTotal} exceeds remaining PO quantity ${ordered - received} for item ${item.id}.`,
            );
          }
          await this.receiptsRepository.updatePoItemReceivedQty(item.poItemId, acceptedTotal);
        }
      }

      // Update PO status overall
      if (receipt.purchaseOrderId) {
        const totals = await this.receiptsRepository.getPoTotals(receipt.purchaseOrderId);
        if (
          this.toScaled(totals.receivedQuantity) >= this.toScaled(totals.orderedQuantity) &&
          totals.orderedQuantity > 0
        ) {
          await this.receiptsRepository.updatePoStatus(receipt.purchaseOrderId, PurchaseOrderStatusValues.RECEIVED);
        } else if (totals.receivedQuantity > 0) {
          await this.receiptsRepository.updatePoStatus(
            receipt.purchaseOrderId,
            PurchaseOrderStatusValues.PARTIALLY_RECEIVED,
          );
        }
      }

      await this.receiptsRepository.updateStatus(id, GoodsReceiptStatusValues.PUBLISHED, new Date());
    });

    void this.poItemsRepository;
    return this.receiptsService.findById(id);
  }

  private toScaled(value: number): number {
    return Math.round(value * 1000);
  }
}
