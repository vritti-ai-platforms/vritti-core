import type { GoodsReceiptLineWithRefs } from '../../repositories/goods-receipt-lines.repository';

export class GoodsReceiptLineDto {
  id: string;
  goodsReceiptItemId: string;
  goodsReceiptLotId: string | null;
  locationId: string;
  locationName: string | null;
  locationPath: string | null;
  // Lot info (denormalized from goods_receipt_lots — for display)
  lotNumber: string | null;
  manufacturingDate: string | null;
  expiryDate: string | null;
  quantity: number;
  resolvedQuantId: string | null;
  isBalanced: boolean;
  lineItemsCount: number;
  metadata: Record<string, unknown>;
  createdAt: string;

  static from(row: GoodsReceiptLineWithRefs): GoodsReceiptLineDto {
    const dto = new GoodsReceiptLineDto();
    dto.id = row.id;
    dto.goodsReceiptItemId = row.goodsReceiptItemId;
    dto.goodsReceiptLotId = row.goodsReceiptLotId ?? null;
    dto.locationId = row.locationId;
    dto.locationName = row.locationName ?? null;
    dto.locationPath = row.locationPath ?? null;
    dto.lotNumber = row.lotNumber ?? null;
    dto.manufacturingDate = row.lotManufacturingDate ?? null;
    dto.expiryDate = row.lotExpiryDate ?? null;
    dto.quantity = row.quantity;
    dto.resolvedQuantId = row.resolvedQuantId ?? null;
    dto.isBalanced = row.isBalanced;
    dto.lineItemsCount = row.lineItemsCount;
    dto.metadata = (row.metadata ?? {}) as Record<string, unknown>;
    dto.createdAt = row.createdAt.toISOString();
    return dto;
  }
}
