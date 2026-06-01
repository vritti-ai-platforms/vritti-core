import { CurrencyAmountDto } from '@vritti/api-sdk';
import Decimal from '@vritti/api-sdk/decimal';
import type { FreeSchemeMode, InventoryTracking } from '@/db/schema';
import type { GoodsReceiptItemWithRefs } from '../../repositories/goods-receipt-items.repository';

export class GoodsReceiptItemDto {
  id: string;
  goodsReceiptId: string;
  inventoryItemId: string;
  inventoryItemName: string;
  inventoryItemTracking: InventoryTracking;
  inventoryItemUomSymbol: string;
  inventoryItemAllowDecimal: boolean;
  orderedQty: number;
  freeQty: number;
  totalQty: number;
  schemeBuyQty: number | null;
  schemeFreeQty: number | null;
  schemeMode: FreeSchemeMode;
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
    dto.orderedQty = Number(row.orderedQty ?? 0);
    dto.freeQty = Number(row.freeQty ?? 0);
    dto.totalQty = Number(row.totalQty ?? 0);
    dto.schemeBuyQty = row.schemeBuyQty != null ? Number(row.schemeBuyQty) : null;
    dto.schemeFreeQty = row.schemeFreeQty != null ? Number(row.schemeFreeQty) : null;
    dto.schemeMode = row.schemeMode ?? 'none';
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
      // Line total = the value paid = unit price × ordered (paid) quantity; free units are not billed.
      const lineTotalMinor = BigInt(new Decimal(unitPriceMinor.toString()).times(dto.orderedQty).toFixed(0));
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
