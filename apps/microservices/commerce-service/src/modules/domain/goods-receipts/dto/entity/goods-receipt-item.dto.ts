import { CurrencyAmountDto } from '@vritti/api-sdk';
import Decimal from '@vritti/api-sdk/decimal';
import type { InventoryTracking } from '@/db/schema';
import type { GoodsReceiptItemWithRefs } from '../../repositories/goods-receipt-items.repository';

export class GoodsReceiptItemDto {
  id: string;
  goodsReceiptId: string;
  inventoryItemId: string;
  inventoryItemName: string;
  inventoryItemTracking: InventoryTracking;
  inventoryItemUomSymbol: string;
  inventoryItemAllowDecimal: boolean;
  quantity: number;
  acceptedQuantity: number;
  rejectedQuantity: number;
  lotsCount: number;
  linesCount: number;
  poOrderedQuantity: number | null;
  poReceivedQuantity: number | null;
  poRemainingQuantity: number | null;
  unitPrice: CurrencyAmountDto | null;
  lineTotal: CurrencyAmountDto | null;
  metadata: Record<string, unknown>;
  createdAt: string;

  static from(row: GoodsReceiptItemWithRefs): GoodsReceiptItemDto {
    const dto = new GoodsReceiptItemDto();
    dto.id = row.id;
    dto.goodsReceiptId = row.goodsReceiptId;
    dto.inventoryItemId = row.inventoryItemId;
    dto.inventoryItemName = row.inventoryItemName ?? '';
    dto.inventoryItemTracking = row.inventoryItemTracking;
    dto.inventoryItemUomSymbol = row.inventoryItemUomSymbol ?? '';
    dto.inventoryItemAllowDecimal = row.inventoryItemAllowDecimal ?? false;
    dto.quantity = Number(row.quantity ?? 0);
    dto.acceptedQuantity = Number(row.acceptedQuantity ?? 0);
    dto.rejectedQuantity = row.rejectedQuantity ?? 0;
    dto.lotsCount = row.lotsCount;
    dto.linesCount = row.linesCount;
    dto.poOrderedQuantity = row.poOrderedQuantity != null ? Number(row.poOrderedQuantity) : null;
    dto.poReceivedQuantity = row.poReceivedQuantity != null ? Number(row.poReceivedQuantity) : null;
    dto.poRemainingQuantity =
      dto.poOrderedQuantity != null ? dto.poOrderedQuantity - (dto.poReceivedQuantity ?? 0) : null;
    if (row.unitPrice != null && row.currencyCode) {
      const unitPriceMinor = BigInt(row.unitPrice as unknown as string);
      dto.unitPrice = CurrencyAmountDto.from(unitPriceMinor, row.currencyCode);
      const lineTotalMinor = BigInt(new Decimal(unitPriceMinor.toString()).times(dto.quantity).toFixed(0));
      dto.lineTotal = CurrencyAmountDto.from(lineTotalMinor, row.currencyCode);
    } else {
      dto.unitPrice = null;
      dto.lineTotal = null;
    }
    dto.metadata = (row.metadata ?? {}) as Record<string, unknown>;
    dto.createdAt = row.createdAt.toISOString();
    return dto;
  }
}
