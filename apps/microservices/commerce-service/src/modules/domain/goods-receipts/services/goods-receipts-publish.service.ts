import { InventoryItemBatchesService } from '@domain/inventory-item-batches/services/inventory-item-batches.service';
import { InventoryLedgerService } from '@domain/inventory-ledger/services/inventory-ledger.service';
import { PurchaseOrderItemsRepository } from '@domain/purchase-orders/repositories/purchase-order-items.repository';
import { Injectable } from '@nestjs/common';
import { BadRequestException, NotFoundException } from '@vritti/api-sdk';
import _ from '@vritti/api-sdk/lodash';
import {
  GoodsReceiptStatusValues,
  InventoryLedgerReferenceTypeValues,
  InventoryLedgerTypeValues,
  PurchaseOrderStatusValues,
} from '@/db/schema';
import { GoodsReceiptDto } from '../dto/entity/goods-receipt.dto';
import { GoodsReceiptBatchItemsRepository } from '../repositories/goods-receipt-batch-items.repository';
import { GoodsReceiptBatchesRepository } from '../repositories/goods-receipt-batches.repository';
import { GoodsReceiptItemsRepository } from '../repositories/goods-receipt-items.repository';
import { GoodsReceiptsRepository } from '../repositories/goods-receipts.repository';
import { GoodsReceiptsService } from './goods-receipts.service';

@Injectable()
export class GoodsReceiptsPublishService {
  constructor(
    private readonly receiptsRepository: GoodsReceiptsRepository,
    private readonly itemsRepository: GoodsReceiptItemsRepository,
    private readonly batchesRepository: GoodsReceiptBatchesRepository,
    private readonly batchItemsRepository: GoodsReceiptBatchItemsRepository,
    private readonly poItemsRepository: PurchaseOrderItemsRepository,
    private readonly batchesService: InventoryItemBatchesService,
    private readonly ledgerService: InventoryLedgerService,
    private readonly receiptsService: GoodsReceiptsService,
  ) {}

  async startAllocation(id: string): Promise<GoodsReceiptDto> {
    const receipt = await this.receiptsRepository.findByIdWithRefs(id);
    if (!receipt) throw new NotFoundException('Goods receipt not found.');
    if (receipt.status !== GoodsReceiptStatusValues.DRAFT) {
      throw new BadRequestException('Only DRAFT goods receipts can move to allocation.');
    }

    const items = await this.itemsRepository.findByReceiptIdForPublish(id);
    if (items.length === 0) {
      throw new BadRequestException('Cannot move to allocation with no items.');
    }

    await this.receiptsRepository.transaction(async (tx) => {
      await this.receiptsRepository.updateStatusInTx(tx, id, GoodsReceiptStatusValues.ALLOCATION_PENDING);
    });

    return this.receiptsService.findById(id);
  }

  async publish(id: string): Promise<GoodsReceiptDto> {
    const receipt = await this.receiptsRepository.findByIdWithRefs(id);
    if (!receipt) throw new NotFoundException('Goods receipt not found.');
    if (receipt.status !== GoodsReceiptStatusValues.ALLOCATION_PENDING) {
      throw new BadRequestException('Only ALLOCATION_PENDING goods receipts can be published.');
    }

    const items = await this.itemsRepository.findByReceiptIdForPublish(id);
    if (items.length === 0) {
      throw new BadRequestException('Cannot publish a goods receipt with no items.');
    }

    const batches = await this.batchesRepository.findByReceiptIdForPublish(id);
    const groupedBatchesByItem = _.groupBy(batches, (batch) => batch.goodsReceiptLineId);

    for (const item of items) {
      if (Number(item.acceptedQuantity) < 0 || Number(item.rejectedQuantity) < 0) {
        throw new BadRequestException(`Item ${item.id} has invalid accepted/rejected quantities.`);
      }
      if (this.toScaled(Number(item.acceptedQuantity)) === 0 && this.toScaled(Number(item.rejectedQuantity)) === 0) {
        throw new BadRequestException(`Item ${item.id} must have accepted or rejected quantity greater than 0.`);
      }
      const itemBatches = groupedBatchesByItem[item.id] ?? [];
      if (this.toScaled(Number(item.acceptedQuantity)) > 0 && itemBatches.length === 0) {
        throw new BadRequestException(`Item ${item.id} has no batches for publish.`);
      }
      for (const batch of itemBatches) {
        if (!batch.isBalanced) {
          throw new BadRequestException(`Batch ${batch.id} is not balanced. Batch items total must equal accepted quantity.`);
        }
      }
    }

    const batchItemsByBatchId = new Map<string, Awaited<ReturnType<typeof this.batchItemsRepository.findByBatchId>>>();
    for (const batch of batches) {
      const batchItems = await this.batchItemsRepository.findByBatchId(batch.id);
      if (batchItems.length === 0) {
        throw new BadRequestException(`Batch ${batch.id} has no batch items for publish.`);
      }
      batchItemsByBatchId.set(batch.id, batchItems);
      const qtySum = batchItems.reduce((sum, batchItem) => sum + Number(batchItem.quantity), 0);
      if (this.toScaled(qtySum) !== this.toScaled(Number(batch.acceptedQuantity))) {
        throw new BadRequestException(`Batch ${batch.id} batch item total does not match accepted quantity.`);
      }
    }

    const itemAcceptedTotalsFromBatches = new Map<string, number>();
    for (const batch of batches) {
      const batchItems = batchItemsByBatchId.get(batch.id) ?? [];
      const acceptedQty = batchItems.reduce((sum, batchItem) => sum + Number(batchItem.quantity), 0);
      itemAcceptedTotalsFromBatches.set(
        batch.goodsReceiptLineId,
        (itemAcceptedTotalsFromBatches.get(batch.goodsReceiptLineId) ?? 0) + acceptedQty,
      );
    }

    for (const item of items) {
      const itemAcceptedFromBatches = itemAcceptedTotalsFromBatches.get(item.id) ?? 0;
      if (this.toScaled(itemAcceptedFromBatches) !== this.toScaled(Number(item.acceptedQuantity))) {
        throw new BadRequestException(
          `Item ${item.id} accepted quantity must match the total of its batch items.`,
        );
      }
    }

    await this.receiptsRepository.transaction(async (tx) => {
      for (const batch of batches) {
        const batchItems = batchItemsByBatchId.get(batch.id) ?? [];
        const acceptedQty = batchItems.reduce((sum, batchItem) => sum + Number(batchItem.quantity), 0);

        const createdBatch = await this.batchesService.createBatchInTx(tx, {
          inventoryItemId: batch.inventoryItemId,
          locationId: batch.locationId,
          quantity: acceptedQty,
          manufacturingDate: batch.manufacturingDate ?? undefined,
          expiryDate: batch.expiryDate ?? undefined,
        });

        await this.batchesService.upsertBatchItemWithTx(tx, {
          inventoryItemBatchId: createdBatch.id,
          inventoryItemId: batch.inventoryItemId,
          quantity: String(acceptedQty),
        });

        await this.ledgerService.createEntryInTx(tx, {
          inventoryItemId: batch.inventoryItemId,
          batchId: createdBatch.id,
          type: InventoryLedgerTypeValues.GOODS_RECEIPT,
          quantity: String(acceptedQty),
          referenceType: InventoryLedgerReferenceTypeValues.GOODS_RECEIPT,
          referenceId: receipt.id,
          notes: batch.rejectionReason ?? receipt.notes ?? null,
        });
      }

      if (receipt.purchaseOrderId) {
        for (const item of items) {
          const poItem = await this.poItemsRepository.findItemByInventoryItemId(receipt.purchaseOrderId, item.inventoryItemId);
          if (!poItem) {
            throw new BadRequestException(`Inventory item ${item.inventoryItemId} is not part of purchase order.`);
          }
          const acceptedQty = Number(item.acceptedQuantity);
          if (this.toScaled(Number(poItem.receivedQuantity) + acceptedQty) > this.toScaled(Number(poItem.orderedQuantity))) {
            throw new BadRequestException(`Accepted quantity exceeds ordered quantity for PO item ${poItem.id}.`);
          }
          await this.receiptsRepository.updatePoItemReceivedQtyInTx(tx, poItem.id, acceptedQty);
        }

        const totals = await this.receiptsRepository.getPoTotalsInTx(tx, receipt.purchaseOrderId);
        if (this.toScaled(totals.receivedQuantity) >= this.toScaled(totals.orderedQuantity) && totals.orderedQuantity > 0) {
          await this.receiptsRepository.updatePoStatusInTx(tx, receipt.purchaseOrderId, PurchaseOrderStatusValues.RECEIVED);
        } else if (totals.receivedQuantity > 0) {
          await this.receiptsRepository.updatePoStatusInTx(
            tx,
            receipt.purchaseOrderId,
            PurchaseOrderStatusValues.PARTIALLY_RECEIVED,
          );
        }
      }

      await this.receiptsRepository.updateStatusInTx(tx, id, GoodsReceiptStatusValues.PUBLISHED, new Date());
    });

    return this.receiptsService.findById(id);
  }

  private toScaled(value: number): number {
    return Math.round(value * 1000);
  }
}
