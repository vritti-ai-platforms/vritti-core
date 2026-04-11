import type { GoodsReceipt, GoodsReceiptItem } from '@/db/schema';

export class GoodsReceiptItemDto {
  id: string;
  purchaseOrderItemId: string;
  inventoryItemName: string | null;
  acceptedQuantity: number;
  rejectedQuantity: number;
  rejectionReason: string | null;
  batchNumber: string | null;
  manufacturingDate: string | null;
  expiryDate: string | null;

  static from(entity: GoodsReceiptItem, itemName?: string | null): GoodsReceiptItemDto {
    const dto = new GoodsReceiptItemDto();
    dto.id = entity.id;
    dto.purchaseOrderItemId = entity.purchaseOrderItemId;
    dto.inventoryItemName = itemName ?? null;
    dto.acceptedQuantity = Number(entity.acceptedQuantity);
    dto.rejectedQuantity = Number(entity.rejectedQuantity);
    dto.rejectionReason = entity.rejectionReason ?? null;
    dto.batchNumber = entity.batchNumber ?? null;
    dto.manufacturingDate = entity.manufacturingDate ?? null;
    dto.expiryDate = entity.expiryDate ?? null;
    return dto;
  }
}

export class GoodsReceiptDto {
  id: string;
  purchaseOrderId: string;
  receivedBy: string | null;
  receivedDate: string;
  notes: string | null;
  createdAt: string;
  items: GoodsReceiptItemDto[];

  static from(entity: GoodsReceipt, items: GoodsReceiptItemDto[]): GoodsReceiptDto {
    const dto = new GoodsReceiptDto();
    dto.id = entity.id;
    dto.purchaseOrderId = entity.purchaseOrderId;
    dto.receivedBy = entity.receivedBy ?? null;
    dto.receivedDate = entity.receivedDate;
    dto.notes = entity.notes ?? null;
    dto.createdAt = entity.createdAt.toISOString();
    dto.items = items;
    return dto;
  }
}
