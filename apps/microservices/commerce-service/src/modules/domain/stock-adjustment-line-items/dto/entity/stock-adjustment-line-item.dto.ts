import type { StockAdjustmentLineItem } from '@/db/schema';

export class StockAdjustmentLineItemDto {
  id: string;
  stockAdjustmentLineId: string;
  inventoryItemId: string;
  quantity: number;
  createdAt: string;

  static from(entity: StockAdjustmentLineItem): StockAdjustmentLineItemDto {
    const dto = new StockAdjustmentLineItemDto();
    dto.id = entity.id;
    dto.stockAdjustmentLineId = entity.stockAdjustmentLineId;
    dto.inventoryItemId = entity.inventoryItemId;
    dto.quantity = Number(entity.quantity);
    dto.createdAt = entity.createdAt.toISOString();
    return dto;
  }
}
