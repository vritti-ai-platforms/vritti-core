import type { GoodsReceiptCounts } from '../../repositories/goods-receipts.repository';

export class GoodsReceiptCountsDto {
  itemCount: number;

  // Shapes how many items a goods receipt has, the count its breakdown and items' cost tabs both list
  static from(row: GoodsReceiptCounts): GoodsReceiptCountsDto {
    const dto = new GoodsReceiptCountsDto();
    dto.itemCount = row.itemCount;
    return dto;
  }
}
