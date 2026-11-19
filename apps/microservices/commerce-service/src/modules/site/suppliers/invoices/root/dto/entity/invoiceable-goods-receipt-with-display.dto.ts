import type { InvoiceableGoodsReceiptDto } from '@domain/supplier-invoices/dto/entity/invoiceable-goods-receipt.dto';
import type { DisplayUomQuantityDto } from '@domain/uom-conversions/dto/entity/display-uom-quantity.dto';

export type InvoiceableGoodsReceiptDisplayDto = Record<
  'acceptedPrimaryQty' | 'invoicedPrimaryQty' | 'openPrimaryQty',
  DisplayUomQuantityDto | null
>;

export type InvoiceableGoodsReceiptWithDisplayDto = InvoiceableGoodsReceiptDto & {
  display: InvoiceableGoodsReceiptDisplayDto;
};
