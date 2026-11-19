import type { DisplayUnitRatios } from '@/db/schema';
import type { StockAdjustmentLotWithStats } from '../../repositories/stock-adjustment-lots.repository';

export class StockAdjustmentLotDto {
  id: string;
  stockAdjustmentId: string;
  lotNumber: string;
  manufacturingDate: string | null;
  expiryDate: string | null;
  resolvedLotId: string | null;
  linesCount: number;
  totalQuantity: number;
  createdAt: string;
  displayUnitRatios: DisplayUnitRatios;

  static from(row: StockAdjustmentLotWithStats): StockAdjustmentLotDto {
    const dto = new StockAdjustmentLotDto();
    dto.id = row.id;
    dto.stockAdjustmentId = row.stockAdjustmentId;
    dto.lotNumber = row.lotNumber;
    dto.manufacturingDate = row.manufacturingDate ?? null;
    dto.expiryDate = row.expiryDate ?? null;
    dto.resolvedLotId = row.resolvedLotId ?? null;
    dto.linesCount = row.linesCount;
    dto.totalQuantity = row.totalQuantity;
    dto.createdAt = row.createdAt.toISOString();
    dto.displayUnitRatios = row.displayUnitRatios;
    return dto;
  }
}
