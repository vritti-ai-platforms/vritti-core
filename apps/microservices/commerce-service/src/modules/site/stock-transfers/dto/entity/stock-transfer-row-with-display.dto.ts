import type { StockTransferRowDto } from '@domain/stock-transfers/dto/entity/stock-transfer.dto';
import type { DisplayUomQuantityDto } from '@domain/uom-conversions/dto/entity/display-uom-quantity.dto';

export type StockTransferDisplayDto = Record<'quantity', DisplayUomQuantityDto | null>;

export type StockTransferRowWithDisplayDto = Omit<StockTransferRowDto, 'displayUnitRatios'> & {
  display: StockTransferDisplayDto;
};
