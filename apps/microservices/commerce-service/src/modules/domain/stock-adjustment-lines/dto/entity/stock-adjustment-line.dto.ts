import type { StockAdjustmentLine } from '@/db/schema';

export class StockAdjustmentLineDto {
  id: string;
  stockAdjustmentId: string;
  createdById: string;
  batchId: string | null;
  batchNumber: string | null;
  locationId: string | null;
  locationName: string | null;
  quantity: number;
  lineItemsCount: number;
  lineItemsQuantitySum: number;
  lineItemsDelta: number;
  isBalanced: boolean;
  isLineItemsBalanced: boolean;
  manufacturingDate: string | null;
  expiryDate: string | null;
  createdAt: string;

  static from(
    row: StockAdjustmentLine & {
      locationName?: string | null;
      lineItemsCount?: number;
      lineItemsQuantitySum?: number;
      lineItemsDelta?: number;
      isBalanced?: boolean;
      isLineItemsBalanced?: boolean;
    },
  ): StockAdjustmentLineDto {
    const dto = new StockAdjustmentLineDto();
    dto.id = row.id;
    dto.stockAdjustmentId = row.stockAdjustmentId;
    dto.createdById = row.createdById;
    dto.batchId = row.batchId ?? null;
    dto.batchNumber = row.batchNumber ?? null;
    dto.locationId = row.locationId ?? null;
    dto.locationName = row.locationName ?? null;
    dto.quantity = Number(row.quantity);
    dto.lineItemsCount = Number(row.lineItemsCount ?? 0);
    dto.lineItemsQuantitySum = Number(row.lineItemsQuantitySum ?? 0);
    dto.lineItemsDelta = Number(row.lineItemsDelta ?? dto.quantity - dto.lineItemsQuantitySum);
    dto.isBalanced = row.isBalanced ?? (dto.lineItemsCount > 0 && dto.lineItemsDelta === 0);
    dto.isLineItemsBalanced = row.isLineItemsBalanced ?? dto.isBalanced;
    dto.manufacturingDate = row.manufacturingDate ?? null;
    dto.expiryDate = row.expiryDate ?? null;
    dto.createdAt = row.createdAt.toISOString();
    return dto;
  }
}
