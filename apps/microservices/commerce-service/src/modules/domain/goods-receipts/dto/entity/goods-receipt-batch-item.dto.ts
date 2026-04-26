import type { GoodsReceiptBatchItem } from '@/db/schema';

export class GoodsReceiptBatchItemDto {
  id: string;
  goodsReceiptBatchId: string;
  serialNumber: string;
  createdAt: string;

  static from(entity: GoodsReceiptBatchItem): GoodsReceiptBatchItemDto {
    const dto = new GoodsReceiptBatchItemDto();
    dto.id = entity.id;
    dto.goodsReceiptBatchId = entity.goodsReceiptBatchId;
    dto.serialNumber = entity.serialNumber;
    dto.createdAt = entity.createdAt.toISOString();
    return dto;
  }
}
