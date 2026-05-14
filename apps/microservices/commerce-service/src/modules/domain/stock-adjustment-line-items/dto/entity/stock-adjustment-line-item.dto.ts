import type { StockAdjustmentLineItem } from '@/db/schema';

export class StockAdjustmentLineItemDto {
  id: string;
  stockAdjustmentLineId: string;
  serialNumber: string;
  createdAt: string;

  static from(entity: StockAdjustmentLineItem): StockAdjustmentLineItemDto {
    const dto = new StockAdjustmentLineItemDto();
    dto.id = entity.id;
    dto.stockAdjustmentLineId = entity.stockAdjustmentLineId;
    dto.serialNumber = entity.serialNumber;
    dto.createdAt = entity.createdAt.toISOString();
    return dto;
  }
}
