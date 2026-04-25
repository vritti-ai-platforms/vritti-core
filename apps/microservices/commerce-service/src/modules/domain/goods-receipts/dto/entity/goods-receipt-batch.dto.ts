import type { GoodsReceiptBatch } from '@/db/schema';

export class GoodsReceiptBatchDto {
  id: string;
  goodsReceiptLineId: string;
  inventoryItemId: string;
  inventoryItemName: string | null;
  locationId: string;
  locationName: string | null;
  acceptedQuantity: number;
  rejectedQuantity: number;
  rejectionReason: string | null;
  manufacturingDate: string | null;
  expiryDate: string | null;
  batchItemsCount: number;
  batchItemsQuantitySum: number;
  batchItemsDelta: number;
  isBalanced: boolean;
  createdAt: string;

  static from(
    entity: GoodsReceiptBatch & {
      inventoryItemName?: string | null;
      locationName?: string | null;
      batchItemsCount?: number;
      batchItemsQuantitySum?: number;
      batchItemsDelta?: number;
    },
  ): GoodsReceiptBatchDto {
    const dto = new GoodsReceiptBatchDto();
    dto.id = entity.id;
    dto.goodsReceiptLineId = entity.goodsReceiptLineId;
    dto.inventoryItemId = entity.inventoryItemId;
    dto.inventoryItemName = entity.inventoryItemName ?? null;
    dto.locationId = entity.locationId;
    dto.locationName = entity.locationName ?? null;
    dto.acceptedQuantity = Number(entity.acceptedQuantity);
    dto.rejectedQuantity = Number(entity.rejectedQuantity);
    dto.rejectionReason = entity.rejectionReason ?? null;
    dto.manufacturingDate = entity.manufacturingDate ?? null;
    dto.expiryDate = entity.expiryDate ?? null;
    dto.batchItemsCount = Number(entity.batchItemsCount ?? 0);
    dto.batchItemsQuantitySum = Number(entity.batchItemsQuantitySum ?? 0);
    dto.batchItemsDelta = Number(entity.batchItemsDelta ?? dto.acceptedQuantity - dto.batchItemsQuantitySum);
    dto.isBalanced = entity.isBalanced;
    dto.createdAt = entity.createdAt.toISOString();
    return dto;
  }
}
