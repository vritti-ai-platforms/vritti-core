import type { StockAdjustmentLineWithRefs } from '../../repositories/stock-adjustment-lines.repository';

export class StockAdjustmentLineDto {
  id: string;
  stockAdjustmentId: string;

  // Register intent (OPENING_STOCK):
  stockAdjustmentLotId: string | null;
  locationId: string | null;
  locationName: string | null;
  locationPath: string | null;

  // Lot info (denormalized from stock_adjustment_lots — for display)
  lotNumber: string | null;
  manufacturingDate: string | null;
  expiryDate: string | null;

  // Change intent (deduct/CORRECTION):
  quantId: string | null;
  // Source quant detail (denormalized — for display)
  quantLotNumber: string | null;
  quantLocationId: string | null;
  quantLocationName: string | null;
  quantLocationPath: string | null;
  quantTotalQuantity: number | null;
  quantReservedQuantity: number | null;
  quantAvailableQuantity: number | null;

  uomId: string;
  uomName: string | null;
  uomSymbol: string | null;
  conversionFactor: number;
  quantity: number;
  resolvedQuantId: string | null;
  isBalanced: boolean;
  lineItemsCount: number;
  createdAt: string;

  static from(row: StockAdjustmentLineWithRefs): StockAdjustmentLineDto {
    const dto = new StockAdjustmentLineDto();
    dto.id = row.id;
    dto.stockAdjustmentId = row.stockAdjustmentId;
    dto.stockAdjustmentLotId = row.stockAdjustmentLotId ?? null;
    dto.locationId = row.locationId ?? null;
    dto.locationName = row.locationName ?? null;
    dto.locationPath = row.locationPath ?? null;
    dto.lotNumber = row.lotNumber ?? null;
    dto.manufacturingDate = row.lotManufacturingDate ?? null;
    dto.expiryDate = row.lotExpiryDate ?? null;
    dto.quantId = row.quantId ?? null;
    dto.quantLotNumber = row.quantLotNumber ?? null;
    dto.quantLocationId = row.quantLocationId ?? null;
    dto.quantLocationName = row.quantLocationName ?? null;
    dto.quantLocationPath = row.quantLocationPath ?? null;
    dto.quantTotalQuantity = row.quantTotalQuantity != null ? Number(row.quantTotalQuantity) : null;
    dto.quantReservedQuantity = row.quantReservedQuantity != null ? Number(row.quantReservedQuantity) : null;
    dto.quantAvailableQuantity =
      dto.quantTotalQuantity !== null && dto.quantReservedQuantity !== null
        ? dto.quantTotalQuantity - dto.quantReservedQuantity
        : null;
    dto.uomId = row.uomId;
    dto.uomName = row.uomName ?? null;
    dto.uomSymbol = row.uomSymbol ?? null;
    dto.conversionFactor = Number(row.conversionFactor);
    dto.quantity = Number(row.quantity);
    dto.resolvedQuantId = row.resolvedQuantId ?? null;
    dto.isBalanced = row.isBalanced;
    dto.lineItemsCount = row.lineItemsCount;
    dto.createdAt = row.createdAt.toISOString();
    return dto;
  }
}
