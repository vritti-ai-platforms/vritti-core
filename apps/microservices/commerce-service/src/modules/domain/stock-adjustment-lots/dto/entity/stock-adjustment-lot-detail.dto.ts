import type { StockAdjustmentLotDetailRow } from '../../repositories/stock-adjustment-lots.repository';

// Detail view returned for a single lot — lot fields + the line-derived helpers
// the FE needs (already-used location ids for excludeIds, line ids).
export class StockAdjustmentLotDetailDto {
  id: string;
  stockAdjustmentId: string;
  lotNumber: string;
  manufacturingDate: string | null;
  expiryDate: string | null;
  resolvedLotId: string | null;
  linesCount: number;
  totalQuantity: number;
  locationIds: string[];
  lineIds: string[];
  metadata: Record<string, unknown>;
  createdAt: string;

  static from(row: StockAdjustmentLotDetailRow): StockAdjustmentLotDetailDto {
    const dto = new StockAdjustmentLotDetailDto();
    dto.id = row.id;
    dto.stockAdjustmentId = row.stockAdjustmentId;
    dto.lotNumber = row.lotNumber;
    dto.manufacturingDate = row.manufacturingDate ?? null;
    dto.expiryDate = row.expiryDate ?? null;
    dto.resolvedLotId = row.resolvedLotId ?? null;
    dto.linesCount = row.linesCount;
    dto.totalQuantity = row.totalQuantity;
    dto.locationIds = row.locationIds;
    dto.lineIds = row.lineIds;
    dto.metadata = (row.metadata ?? {}) as Record<string, unknown>;
    dto.createdAt = row.createdAt.toISOString();
    return dto;
  }
}
