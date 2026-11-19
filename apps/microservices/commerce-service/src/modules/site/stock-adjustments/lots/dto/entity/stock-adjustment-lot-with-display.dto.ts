import type { StockAdjustmentLotDto } from '@domain/stock-adjustment-lots/dto/entity/stock-adjustment-lot.dto';
import type { StockAdjustmentLotDetailDto } from '@domain/stock-adjustment-lots/dto/entity/stock-adjustment-lot-detail.dto';
import type { StockAdjustmentTreeLotNode } from '@domain/stock-adjustment-lots/dto/entity/stock-adjustment-tree.dto';
import type { DisplayUomQuantityDto } from '@domain/uom-conversions/dto/entity/display-uom-quantity.dto';

export type StockAdjustmentLotDisplayDto = Record<'totalQuantity', DisplayUomQuantityDto | null>;

export type StockAdjustmentLotWithDisplayDto = Omit<StockAdjustmentLotDto, 'displayUnitRatios'> & {
  display: StockAdjustmentLotDisplayDto;
};

export type StockAdjustmentLotDetailWithDisplayDto = Omit<StockAdjustmentLotDetailDto, 'displayUnitRatios'> & {
  display: StockAdjustmentLotDisplayDto;
};

export type StockAdjustmentTreeLotNodeWithDisplayDto = Omit<StockAdjustmentTreeLotNode, 'displayUnitRatios'> & {
  display: StockAdjustmentLotDisplayDto;
};
