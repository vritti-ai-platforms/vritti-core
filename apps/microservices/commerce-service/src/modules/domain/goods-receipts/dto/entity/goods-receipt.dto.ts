import type { GoodsReceipt, GoodsReceiptItem } from '@/db/schema';

export class GoodsReceiptItemDto {
  id: string;
  purchaseOrderItemId: string | null;
  inventoryItemId: string;
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
    dto.purchaseOrderItemId = entity.purchaseOrderItemId ?? null;
    dto.inventoryItemId = entity.inventoryItemId;
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
  grNumber: string;
  supplierId: string;
  supplierName: string | null;
  status: string;
  po: {
    id: string;
    poNumber: string;
    orderDate: string;
    expectedBy: string | null;
    totalAmount: { currency: string; value: number } | null;
  } | null;
  receivedBy: string | null;
  receivedDate: string;
  notes: string | null;
  createdAt: string;
  items: GoodsReceiptItemDto[];

  static from(
    entity: GoodsReceipt,
    items: GoodsReceiptItemDto[],
    refs?: {
      supplierName?: string | null;
      poId?: string | null;
      poNumber?: string | null;
      poOrderDate?: string | null;
      poExpectedBy?: string | null;
      poTotalAmount?: number | null;
      poCurrencyCode?: string | null;
    },
  ): GoodsReceiptDto {
    const dto = new GoodsReceiptDto();
    dto.id = entity.id;
    dto.grNumber = entity.grNumber;
    dto.supplierId = entity.supplierId;
    dto.supplierName = refs?.supplierName ?? null;
    dto.status = entity.status;
    dto.po =
      refs?.poId && refs?.poNumber
        ? {
            id: refs.poId,
            poNumber: refs.poNumber,
            orderDate: refs.poOrderDate ?? '',
            expectedBy: refs.poExpectedBy ?? null,
            totalAmount:
              refs.poTotalAmount != null && refs.poCurrencyCode
                ? { currency: refs.poCurrencyCode, value: refs.poTotalAmount }
                : null,
          }
        : null;
    dto.receivedBy = entity.receivedBy ?? null;
    dto.receivedDate = entity.receivedDate;
    dto.notes = entity.notes ?? null;
    dto.createdAt = entity.createdAt.toISOString();
    dto.items = items;
    return dto;
  }
}
