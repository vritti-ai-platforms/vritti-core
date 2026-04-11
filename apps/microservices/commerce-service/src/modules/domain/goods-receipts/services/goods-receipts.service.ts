import { Injectable, Logger } from '@nestjs/common';
import { NotFoundException } from '@vritti/api-sdk';
import { InventoryLedgerTypeValues } from '@/db/schema';
import { GoodsReceiptDto, GoodsReceiptItemDto } from '../dto/entity/goods-receipt.dto';
import type { CreateGoodsReceiptDto } from '@/modules/goods-receipts/dto/request/create-goods-receipt.dto';
import { GoodsReceiptsRepository } from '../repositories/goods-receipts.repository';
import { InventoryLevelsService } from '@domain/inventory-levels/services/inventory-levels.service';
import { PurchaseOrdersRepository } from '@domain/purchase-orders/repositories/purchase-orders.repository';

@Injectable()
export class GoodsReceiptsService {
  private readonly logger = new Logger(GoodsReceiptsService.name);

  constructor(
    private readonly repository: GoodsReceiptsRepository,
    private readonly poRepository: PurchaseOrdersRepository,
    private readonly inventoryLevelsService: InventoryLevelsService,
  ) {}

  // Creates a goods receipt, updates PO received quantities, and updates inventory levels + ledger
  async create(data: CreateGoodsReceiptDto): Promise<GoodsReceiptDto> {
    const po = await this.poRepository.findById(data.purchaseOrderId);
    if (!po) throw new NotFoundException('Purchase order not found.');

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
      })),
    );

    // Update PO item received quantities and inventory levels
    for (const item of data.items) {
      const acceptedQty = item.acceptedQuantity;

      // Update PO item received_quantity
      await this.repository.updatePoItemReceivedQty(item.purchaseOrderItemId, acceptedQty);

      // Add stock via InventoryLevelsService
      const inventoryItemId = await this.repository.findInventoryItemIdFromPoItem(item.purchaseOrderItemId);
      if (inventoryItemId && acceptedQty > 0) {
        await this.inventoryLevelsService.addStock({
          itemId: inventoryItemId,
          locationId: data.locationId,
          quantity: acceptedQty,
          type: InventoryLedgerTypeValues.GOODS_RECEIPT,
          referenceType: 'GOODS_RECEIPT',
          referenceId: gr.id,
          notes: `GR for PO ${po.poNumber}`,
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
