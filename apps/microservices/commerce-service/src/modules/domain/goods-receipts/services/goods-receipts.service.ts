import { InventoryItemBatchesService } from '@domain/inventory-item-batches/services/inventory-item-batches.service';
import { PurchaseOrdersRepository } from '@domain/purchase-orders/repositories/purchase-orders.repository';
import { Injectable, Logger } from '@nestjs/common';
import { BadRequestException, NotFoundException } from '@vritti/api-sdk';
import { InventoryLedgerReferenceTypeValues, InventoryLedgerTypeValues, PurchaseOrderStatusValues } from '@/db/schema';
import type { CreateGoodsReceiptDto } from '@/modules/goods-receipts/dto/request/create-goods-receipt.dto';
import { GoodsReceiptDto, GoodsReceiptItemDto } from '../dto/entity/goods-receipt.dto';
import { GoodsReceiptsRepository } from '../repositories/goods-receipts.repository';

@Injectable()
export class GoodsReceiptsService {
  private readonly logger = new Logger(GoodsReceiptsService.name);

  constructor(
    private readonly repository: GoodsReceiptsRepository,
    private readonly poRepository: PurchaseOrdersRepository,
    private readonly batchesService: InventoryItemBatchesService,
  ) {}

  // Creates a goods receipt, updates PO received quantities, and creates inventory batches + ledger entries
  async create(data: CreateGoodsReceiptDto): Promise<GoodsReceiptDto> {
    const po = await this.poRepository.findById(data.purchaseOrderId);
    if (!po) throw new NotFoundException('Purchase order not found.');
    if (![PurchaseOrderStatusValues.CONFIRMED, PurchaseOrderStatusValues.PARTIALLY_RECEIVED].includes(po.status)) {
      throw new BadRequestException('Goods can only be received for CONFIRMED or PARTIALLY_RECEIVED purchase orders.');
    }
    if (!data.items?.length) {
      throw new BadRequestException('At least one receipt line item is required.');
    }

    const duplicatePoItemIds = new Set<string>();
    for (const item of data.items) {
      if (duplicatePoItemIds.has(item.purchaseOrderItemId)) {
        throw new BadRequestException(`Duplicate receipt line for PO item ${item.purchaseOrderItemId}.`);
      }
      duplicatePoItemIds.add(item.purchaseOrderItemId);

      const acceptedQty = Number(item.acceptedQuantity ?? 0);
      const rejectedQty = Number(item.rejectedQuantity ?? 0);
      if (acceptedQty <= 0 && rejectedQty <= 0) {
        throw new BadRequestException('Each receipt line must have acceptedQuantity or rejectedQuantity greater than zero.');
      }
      if (rejectedQty > 0 && !item.rejectionReason?.trim()) {
        throw new BadRequestException('Rejection reason is required when rejected quantity is greater than zero.');
      }

      const poItem = await this.repository.findPoItemForReceipt(item.purchaseOrderItemId);
      if (!poItem || poItem.purchaseOrderId !== po.id) {
        throw new BadRequestException(`PO item ${item.purchaseOrderItemId} does not belong to purchase order ${po.poNumber}.`);
      }

      const remainingQty = Number(poItem.orderedQuantity) - Number(poItem.receivedQuantity);
      if (remainingQty <= 0) {
        throw new BadRequestException(`PO item ${item.purchaseOrderItemId} is already fully received.`);
      }
      if (acceptedQty + rejectedQty > remainingQty) {
        throw new BadRequestException(
          `Accepted + rejected quantity cannot exceed remaining quantity (${remainingQty}) for PO item ${item.purchaseOrderItemId}.`,
        );
      }
    }

    // Create the GR header
    const gr = await this.repository.create({
      purchaseOrderId: data.purchaseOrderId,
      receivedBy: data.receivedBy ?? null,
      receivedDate: data.receivedDate,
      notes: data.notes ?? null,
    });

    // Create GR items and update PO + inventory for each
    const grItems = await this.repository.createItems(
      data.items.map((item) => ({
        goodsReceiptId: gr.id,
        purchaseOrderItemId: item.purchaseOrderItemId,
        acceptedQuantity: String(item.acceptedQuantity),
        rejectedQuantity: String(item.rejectedQuantity ?? 0),
        rejectionReason: item.rejectionReason ?? null,
        batchNumber: item.batchNumber ?? null,
        manufacturingDate: item.manufacturingDate ?? null,
        expiryDate: item.expiryDate ?? null,
      })),
    );

    // Update PO item received quantities and create inventory batches
    for (let i = 0; i < data.items.length; i++) {
      const item = data.items[i];
      const grItem = grItems[i];
      const acceptedQty = item.acceptedQuantity;

      // Update PO item received_quantity
      await this.repository.updatePoItemReceivedQty(item.purchaseOrderItemId, acceptedQty);

      // Create inventory batch via InventoryItemBatchesService
      const inventoryItemId = await this.repository.findInventoryItemIdFromPoItem(item.purchaseOrderItemId);
      if (inventoryItemId && acceptedQty > 0) {
        await this.batchesService.createBatch({
          inventoryItemId,
          locationId: data.locationId,
          quantity: acceptedQty,
          batchNumber: item.batchNumber ?? undefined,
          manufacturingDate: item.manufacturingDate ?? undefined,
          expiryDate: item.expiryDate ?? undefined,
          goodsReceiptItemId: grItem.id,
          type: InventoryLedgerTypeValues.GOODS_RECEIPT,
          referenceType: InventoryLedgerReferenceTypeValues.GOODS_RECEIPT,
          referenceId: gr.id,
          notes: `Goods receipt for PO ${po.poNumber}`,
        });
      }
    }

    // Check if PO is fully received and update status
    const poItems = await this.poRepository.findItemsByPoId(po.id);
    const allReceived = poItems.every((item) => Number(item.receivedQuantity) >= Number(item.orderedQuantity));
    const someReceived = poItems.some((item) => Number(item.receivedQuantity) > 0);

    if (allReceived) {
      await this.poRepository.update(po.id, { status: 'RECEIVED' });
    } else if (someReceived) {
      await this.poRepository.update(po.id, { status: 'PARTIALLY_RECEIVED' });
    }

    const itemsWithNames = await this.repository.findItemsByGrId(gr.id);
    this.logger.log(`Created GR for PO ${po.poNumber} with ${grItems.length} items`);
    return GoodsReceiptDto.from(
      gr,
      itemsWithNames.map((i) => GoodsReceiptItemDto.from(i, i.inventoryItemName)),
    );
  }

  // Returns all GRs for a PO
  async findByPoId(poId: string): Promise<GoodsReceiptDto[]> {
    const grs = await this.repository.findByPoId(poId);
    const result: GoodsReceiptDto[] = [];
    for (const gr of grs) {
      const itemsWithNames = await this.repository.findItemsByGrId(gr.id);
      result.push(
        GoodsReceiptDto.from(
          gr,
          itemsWithNames.map((i) => GoodsReceiptItemDto.from(i, i.inventoryItemName)),
        ),
      );
    }
    return result;
  }
}
