import type {
  GoodsReceiptItemCostDto,
  GoodsReceiptItemsCostDto,
} from '@domain/goods-receipts/dto/entity/goods-receipt-items-cost.dto';
import type { DisplayUomQuantityDto } from '@domain/uom-conversions/dto/entity/display-uom-quantity.dto';

export type GoodsReceiptItemCostDisplayDto = Record<'acceptedPrimaryQty', DisplayUomQuantityDto | null>;

export type GoodsReceiptItemCostWithDisplayDto = Omit<GoodsReceiptItemCostDto, 'displayUnitRatios'> & {
  display: GoodsReceiptItemCostDisplayDto;
};

export type GoodsReceiptItemsCostWithDisplayDto = Omit<GoodsReceiptItemsCostDto, 'rows'> & {
  rows: GoodsReceiptItemCostWithDisplayDto[];
};
