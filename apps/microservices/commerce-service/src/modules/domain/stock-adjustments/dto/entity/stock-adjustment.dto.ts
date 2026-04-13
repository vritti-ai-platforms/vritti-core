import type { StockAdjustment, StockAdjustmentStatus, StockAdjustmentType } from '@/db/schema';

export class StockAdjustmentDto {
  id: string;
  code: string;
  inventoryItemId: string;
  inventoryItemName: string | null;
  type: StockAdjustmentType;
  status: StockAdjustmentStatus;
  reason: string | null;
  createdById: string | null;
  publishedAt: string | null;
  createdAt: string;

  static from(entity: StockAdjustment & { inventoryItemName?: string | null }): StockAdjustmentDto {
    const dto = new StockAdjustmentDto();
    dto.id = entity.id;
    dto.code = entity.code;
    dto.inventoryItemId = entity.inventoryItemId;
    dto.inventoryItemName = entity.inventoryItemName ?? null;
    dto.type = entity.type;
    dto.status = entity.status;
    dto.reason = entity.reason ?? null;
    dto.createdById = entity.createdById ?? null;
    dto.publishedAt = entity.publishedAt?.toISOString() ?? null;
    dto.createdAt = entity.createdAt.toISOString();
    return dto;
  }
}
