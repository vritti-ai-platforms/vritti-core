import { CurrencyAmountDto } from '@vritti/api-sdk/money';
import type { GoodsReceiptLotWithStats } from '../../repositories/goods-receipt-lots.repository';

export class GoodsReceiptLotDto {
  id: string;
  goodsReceiptItemId: string;
  lotNumber: string;
  manufacturingDate: string | null;
  expiryDate: string | null;
  resolvedLotId: string | null;
  mrp: CurrencyAmountDto | null;
  linesCount: number;
  totalQuantity: number;
  metadata: Record<string, unknown>;
  createdAt: string;

  static from(row: GoodsReceiptLotWithStats, buCurrencyCode?: string): GoodsReceiptLotDto {
    const dto = new GoodsReceiptLotDto();
    dto.id = row.id;
    dto.goodsReceiptItemId = row.goodsReceiptItemId;
    dto.lotNumber = row.lotNumber;
    dto.manufacturingDate = row.manufacturingDate ?? null;
    dto.expiryDate = row.expiryDate ?? null;
    dto.resolvedLotId = row.resolvedLotId ?? null;
    dto.mrp =
      buCurrencyCode && row.mrp != null
        ? CurrencyAmountDto.from(BigInt(row.mrp as unknown as string), buCurrencyCode)
        : null;
    dto.linesCount = row.linesCount;
    dto.totalQuantity = row.totalQuantity;
    dto.metadata = (row.metadata ?? {}) as Record<string, unknown>;
    dto.createdAt = row.createdAt.toISOString();
    return dto;
  }
}
