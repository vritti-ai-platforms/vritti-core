import type { GoodsReceiptLotWithStats } from '../../repositories/goods-receipt-lots.repository';

export class GoodsReceiptLotDto {
  id: string;
  goodsReceiptItemId: string;
  lotNumber: string;
  manufacturingDate: string | null;
  expiryDate: string | null;
  resolvedLotId: string | null;
  linesCount: number;
  totalQuantity: number;
  isBalanced: boolean;
  metadata: Record<string, unknown>;
  createdAt: string;

  static from(row: GoodsReceiptLotWithStats): GoodsReceiptLotDto {
    const dto = new GoodsReceiptLotDto();
    dto.id = row.id;
    dto.goodsReceiptItemId = row.goodsReceiptItemId;
    dto.lotNumber = row.lotNumber;
    dto.manufacturingDate = row.manufacturingDate ?? null;
    dto.expiryDate = row.expiryDate ?? null;
    dto.resolvedLotId = row.resolvedLotId ?? null;
    dto.linesCount = row.linesCount;
    dto.totalQuantity = row.totalQuantity;
    dto.isBalanced = row.unbalancedLinesCount === 0;
    dto.metadata = (row.metadata ?? {}) as Record<string, unknown>;
    dto.createdAt = row.createdAt.toISOString();
    return dto;
  }
}
