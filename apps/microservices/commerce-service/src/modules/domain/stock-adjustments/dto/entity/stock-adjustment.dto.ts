import type { StockAdjustment } from '@/db/schema';

export class StockAdjustmentDto {
  id: string;
  inventoryItemId: string;
  inventoryItemName: string | null;
  batchId: string | null;
  locationId: string | null;
  type: string;
  quantity: number;
  reason: string | null;
  adjustedBy: string | null;
  createdAt: string;

  static from(entity: StockAdjustment, itemName?: string | null): StockAdjustmentDto {
    const dto = new StockAdjustmentDto();
    dto.id = entity.id;
    dto.inventoryItemId = entity.inventoryItemId;
    dto.inventoryItemName = itemName ?? null;
    dto.batchId = entity.batchId ?? null;
    dto.locationId = entity.locationId ?? null;
    dto.type = entity.type;
    dto.quantity = Number(entity.quantity);
    dto.reason = entity.reason ?? null;
    dto.adjustedBy = entity.adjustedBy ?? null;
    dto.createdAt = entity.createdAt.toISOString();
    return dto;
  }
}
