import type { StockAdjustmentCounts } from '../../repositories/stock-adjustments.repository';

export class StockAdjustmentCountsDto {
  lineCount: number;
  lotCount: number;

  // Shapes how many lines and draft lots an adjustment has, for its Breakdown tab
  static from(row: StockAdjustmentCounts): StockAdjustmentCountsDto {
    const dto = new StockAdjustmentCountsDto();
    dto.lineCount = row.lineCount;
    dto.lotCount = row.lotCount;
    return dto;
  }
}
