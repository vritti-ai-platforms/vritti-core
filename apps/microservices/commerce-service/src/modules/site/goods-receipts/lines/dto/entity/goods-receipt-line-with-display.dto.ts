import type { GoodsReceiptLineDto } from '@domain/goods-receipt-lines/dto/entity/goods-receipt-line.dto';
import type { DisplayUomQuantityDto } from '@domain/uom-conversions/dto/entity/display-uom-quantity.dto';

export type GoodsReceiptLineDisplayDto = Record<'primaryUomQty', DisplayUomQuantityDto | null>;

export type GoodsReceiptLineWithDisplayDto = GoodsReceiptLineDto & { display: GoodsReceiptLineDisplayDto };
