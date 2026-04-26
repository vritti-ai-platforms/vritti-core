import type { StockAdjustmentLineItem } from '@/db/schema';

export class StockAdjustmentLineItemDto {
  id: string;
  stockAdjustmentLineId: string;
  serialNumber: string;
  metadata: Record<string, unknown>;
  createdAt: string;

  static from(entity: StockAdjustmentLineItem): StockAdjustmentLineItemDto {
    const dto = new StockAdjustmentLineItemDto();
    dto.id = entity.id;
    dto.stockAdjustmentLineId = entity.stockAdjustmentLineId;
    dto.serialNumber = entity.serialNumber;
    dto.metadata = (entity.metadata ?? {}) as Record<string, unknown>;
    dto.createdAt = entity.createdAt.toISOString();
    return dto;
  }
}
