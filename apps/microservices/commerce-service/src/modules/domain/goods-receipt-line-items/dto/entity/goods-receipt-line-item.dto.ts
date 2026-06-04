import type { GoodsReceiptLineItem } from '@/db/schema';

export class GoodsReceiptLineItemDto {
  id: string;
  goodsReceiptLineId: string;
  serialNumber: string;
  metadata: Record<string, unknown>;
  createdAt: string;

  static from(entity: GoodsReceiptLineItem): GoodsReceiptLineItemDto {
    const dto = new GoodsReceiptLineItemDto();
    dto.id = entity.id;
    dto.goodsReceiptLineId = entity.goodsReceiptLineId;
    dto.serialNumber = entity.serialNumber;
    dto.metadata = (entity.metadata ?? {}) as Record<string, unknown>;
    dto.createdAt = entity.createdAt.toISOString();
    return dto;
  }
}
