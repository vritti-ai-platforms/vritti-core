import type { GoodsReceiptItem } from '@/db/schema';

export class GoodsReceiptItemDto {
  id: string;
  goodsReceiptId: string;
  inventoryItemId: string;
  inventoryItemName: string | null;
  acceptedQuantity: number;
  rejectedQuantity: number;
  poItem: { orderedQuantity: number; receivedQuantity: number } | null;
  createdAt: string;

  // Map a GoodsReceiptItem entity to a DTO
  static from(
    entity: GoodsReceiptItem & {
      inventoryItemId?: string | null;
      inventoryItemName?: string | null;
      acceptedQuantity?: number | string;
      rejectedQuantity?: number | string;
      poOrderedQuantity?: string | null;
      poReceivedQuantity?: string | null;
    },
  ): GoodsReceiptItemDto {
    const dto = new GoodsReceiptItemDto();
    dto.id = entity.id;
    dto.goodsReceiptId = entity.goodsReceiptId;
    dto.inventoryItemId = entity.inventoryItemId;
    dto.inventoryItemName = entity.inventoryItemName ?? null;
    dto.acceptedQuantity = Number(entity.acceptedQuantity ?? 0);
    dto.rejectedQuantity = Number(entity.rejectedQuantity ?? 0);
    dto.poItem =
      entity.poOrderedQuantity != null
        ? {
            orderedQuantity: Number(entity.poOrderedQuantity),
            receivedQuantity: Number(entity.poReceivedQuantity ?? 0),
          }
        : null;
    dto.createdAt = entity.createdAt.toISOString();
    return dto;
  }
}
