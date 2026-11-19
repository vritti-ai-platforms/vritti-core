import type { StockAdjustmentLineDto } from '@domain/stock-adjustment-lines/dto/entity/stock-adjustment-line.dto';
import type { DisplayUomQuantityDto } from '@domain/uom-conversions/dto/entity/display-uom-quantity.dto';

export type StockAdjustmentLineDisplayDto = Record<
  'primaryUomQty' | 'quantTotalQuantity' | 'quantReservedQuantity' | 'quantAvailableQuantity',
  DisplayUomQuantityDto | null
>;

export type StockAdjustmentLineWithDisplayDto = Omit<StockAdjustmentLineDto, 'displayUnitRatios'> & {
  display: StockAdjustmentLineDisplayDto;
};
