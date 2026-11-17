import type { GoodsReceiptLineRow } from '../../repositories/goods-receipt-lines.repository';

export class GoodsReceiptLineDto {
  id: string;
  goodsReceiptItemId: string;
  goodsReceiptLotId: string | null;
  locationId: string;
  locationName: string | null;
  locationPath: string | null;
  lotNumber: string | null;
  manufacturingDate: string | null;
  expiryDate: string | null;
  quantity: number;
  primaryUomQty: number;
  primaryUomSymbol: string;
  resolvedQuantId: string | null;
  isBalanced: boolean;
  lineItemsCount: number;
  createdAt: string;

  static from(row: GoodsReceiptLineRow): GoodsReceiptLineDto {
    const dto = new GoodsReceiptLineDto();
    dto.id = row.id;
    dto.goodsReceiptItemId = row.goodsReceiptItemId;
    dto.goodsReceiptLotId = row.goodsReceiptLotId;
    dto.locationId = row.locationId;
    dto.locationName = row.locationName;
    dto.locationPath = row.locationPath;
    dto.lotNumber = row.lotNumber;
    dto.manufacturingDate = row.lotManufacturingDate;
    dto.expiryDate = row.lotExpiryDate;
    dto.quantity = row.quantity;
    dto.primaryUomQty = row.primaryUomQty;
    dto.primaryUomSymbol = row.primaryUomSymbol;
    dto.resolvedQuantId = row.resolvedQuantId;
    dto.isBalanced = row.isBalanced;
    dto.lineItemsCount = row.lineItemsCount;
    dto.createdAt = row.createdAt.toISOString();
    return dto;
  }
}
