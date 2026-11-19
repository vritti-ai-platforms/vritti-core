import type { StockAdjustmentDto } from '@domain/stock-adjustments/dto/entity/stock-adjustment.dto';
import type { DisplayUomQuantityDto } from '@domain/uom-conversions/dto/entity/display-uom-quantity.dto';

export type StockAdjustmentDisplayDto = Record<'totalQuantity', DisplayUomQuantityDto | null>;

export type StockAdjustmentWithDisplayDto = Omit<StockAdjustmentDto, 'displayUnitRatios'> & {
  display: StockAdjustmentDisplayDto;
};
