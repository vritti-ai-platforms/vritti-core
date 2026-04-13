import type { StockAdjustmentLine } from '@/db/schema';

export class StockAdjustmentLineDto {
  id: string;
  stockAdjustmentId: string;
  batchId: string | null;
  batchNumber: string | null;
  locationId: string | null;
  locationName: string | null;
  quantity: number;
  manufacturingDate: string | null;
  expiryDate: string | null;
  createdAt: string;

  static from(row: StockAdjustmentLine & { locationName?: string | null }): StockAdjustmentLineDto {
    const dto = new StockAdjustmentLineDto();
    dto.id = row.id;
    dto.stockAdjustmentId = row.stockAdjustmentId;
    dto.batchId = row.batchId ?? null;
    dto.batchNumber = row.batchNumber ?? null;
    dto.locationId = row.locationId ?? null;
    dto.locationName = row.locationName ?? null;
    dto.quantity = Number(row.quantity);
    dto.manufacturingDate = row.manufacturingDate ?? null;
    dto.expiryDate = row.expiryDate ?? null;
    dto.createdAt = row.createdAt.toISOString();
    return dto;
  }
}
