import type {
  GoodsReceiptItemQuantRowDto,
  GoodsReceiptItemQuantsDto,
} from '@domain/inventory-item-quants/dto/entity/goods-receipt-item-quants.dto';
import type { DisplayUomQuantityDto } from '@domain/uom-conversions/dto/entity/display-uom-quantity.dto';

export type GoodsReceiptItemQuantDisplayDto = Record<'quantity', DisplayUomQuantityDto | null>;

export type GoodsReceiptItemQuantRowWithDisplayDto = Omit<GoodsReceiptItemQuantRowDto, 'displayUnitRatios'> & {
  display: GoodsReceiptItemQuantDisplayDto;
};

export type GoodsReceiptItemQuantsWithDisplayDto = Omit<GoodsReceiptItemQuantsDto, 'rows'> & {
  rows: GoodsReceiptItemQuantRowWithDisplayDto[];
};
