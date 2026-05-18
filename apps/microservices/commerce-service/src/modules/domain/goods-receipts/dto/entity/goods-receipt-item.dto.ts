import type { InventoryTracking } from '@/db/schema';
import type { GoodsReceiptItemWithRefs } from '../../repositories/goods-receipt-items.repository';

export class GoodsReceiptItemDto {
  id: string;
  goodsReceiptId: string;
  inventoryItemId: string;
  inventoryItemName: string | null;
  inventoryItemTracking: InventoryTracking;
  inventoryItemUomSymbol: string | null;
  acceptedQuantity: number;
  rejectedQuantity: number;
  lotsCount: number;
  linesCount: number;
  poOrderedQuantity: number | null;
  poReceivedQuantity: number | null;
  poRemainingQuantity: number | null;
  metadata: Record<string, unknown>;
  createdAt: string;

  static from(row: GoodsReceiptItemWithRefs): GoodsReceiptItemDto {
    const dto = new GoodsReceiptItemDto();
    dto.id = row.id;
    dto.goodsReceiptId = row.goodsReceiptId;
    dto.inventoryItemId = row.inventoryItemId;
    dto.inventoryItemName = row.inventoryItemName ?? null;
    dto.inventoryItemTracking = row.inventoryItemTracking;
    dto.inventoryItemUomSymbol = row.inventoryItemUomSymbol ?? null;
    dto.acceptedQuantity = Number(row.acceptedQuantity ?? 0);
    dto.rejectedQuantity = Number(row.rejectedQuantity ?? 0);
    dto.lotsCount = row.lotsCount;
    dto.linesCount = row.linesCount;
    dto.poOrderedQuantity = row.poOrderedQuantity != null ? Number(row.poOrderedQuantity) : null;
    dto.poReceivedQuantity = row.poReceivedQuantity != null ? Number(row.poReceivedQuantity) : null;
    dto.poRemainingQuantity =
      dto.poOrderedQuantity != null ? dto.poOrderedQuantity - (dto.poReceivedQuantity ?? 0) : null;
    dto.metadata = (row.metadata ?? {}) as Record<string, unknown>;
    dto.createdAt = row.createdAt.toISOString();
    return dto;
  }
}
