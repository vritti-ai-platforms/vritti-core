import type { GoodsReceiptBatchItem } from '@/db/schema';

export class GoodsReceiptBatchItemDto {
  id: string;
  goodsReceiptBatchId: string;
  quantity: number;
  createdAt: string;

  static from(entity: GoodsReceiptBatchItem): GoodsReceiptBatchItemDto {
    const dto = new GoodsReceiptBatchItemDto();
    dto.id = entity.id;
    dto.goodsReceiptBatchId = entity.goodsReceiptBatchId;
    dto.quantity = Number(entity.quantity);
    dto.createdAt = entity.createdAt.toISOString();
    return dto;
  }
}
