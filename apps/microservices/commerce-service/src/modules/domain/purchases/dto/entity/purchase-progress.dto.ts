import type { PurchaseProgressDetailRow } from '../../repositories/purchases.repository';
import {
  type PurchaseProgressSegments,
  type PurchaseSummary,
  purchaseProgress,
  purchaseSummary,
} from './purchase-table-row.dto';

export class PurchaseProgressDto {
  itemCount: number;
  segments: PurchaseProgressSegments;
  summary: PurchaseSummary | null;

  // Shapes how far a purchase's items have got and where it stands as a whole
  static from(row: PurchaseProgressDetailRow): PurchaseProgressDto {
    const progress = purchaseProgress(row);
    const dto = new PurchaseProgressDto();
    dto.itemCount = progress.itemCount;
    dto.segments = progress.segments;
    dto.summary = purchaseSummary(row.status, progress.segments);
    return dto;
  }
}
