import Decimal from '@vritti/api-sdk/decimal';
import { CurrencyAmountDto } from '@vritti/api-sdk/money';
import type { DisplayUnitRatios } from '@/db/schema';
import type { InvoiceableGoodsReceiptRow } from '../../repositories/invoiceable-goods-receipts.repository';

export class InvoiceableGoodsReceiptDto {
  goodsReceiptId: string;
  grNumber: string;
  receivedDate: string;
  goodsReceiptItemId: string;
  goodsReceiptLotId: string | null;
  lotNumber: string | null;
  expiryDate: string | null;
  mrp: CurrencyAmountDto;
  purchaseOrderId: string;
  poNumber: string;
  purchaseOrderItemId: string;
  inventoryItemId: string;
  inventoryItemName: string;
  uomId: string;
  uomSymbol: string;
  primaryUomSymbol: string;
  poUnitPrice: CurrencyAmountDto;
  poExchangeRate: number;
  acceptedPrimaryQty: number;
  invoicedPrimaryQty: number;
  openPrimaryQty: number;
  openQty: number;

  // Shapes a receipt lot (or item without lots) with what is left to invoice of it, also in the receipt unit by its PO line's ratio
  static from(row: InvoiceableGoodsReceiptRow, leCurrencyCode: string): InvoiceableGoodsReceiptDto {
    const open = new Decimal(row.acceptedPrimaryQty).minus(row.invoicedPrimaryQty);
    const dto = new InvoiceableGoodsReceiptDto();
    dto.goodsReceiptId = row.goodsReceiptId;
    dto.grNumber = row.grNumber;
    dto.receivedDate = row.receivedDate;
    dto.goodsReceiptItemId = row.goodsReceiptItemId;
    dto.goodsReceiptLotId = row.goodsReceiptLotId;
    dto.lotNumber = row.lotNumber;
    dto.expiryDate = row.expiryDate;
    dto.mrp = CurrencyAmountDto.from(row.mrp ?? 0n, leCurrencyCode);
    dto.purchaseOrderId = row.purchaseOrderId;
    dto.poNumber = row.poNumber;
    dto.purchaseOrderItemId = row.purchaseOrderItemId;
    dto.inventoryItemId = row.inventoryItemId;
    dto.inventoryItemName = row.inventoryItemName ?? '';
    dto.uomId = row.uomId;
    dto.uomSymbol = row.uomSymbol;
    dto.primaryUomSymbol = row.primaryUomSymbol;
    dto.poUnitPrice = CurrencyAmountDto.from(row.poUnitPrice, row.poCurrencyCode);
    dto.poExchangeRate = row.poExchangeRate;
    dto.acceptedPrimaryQty = row.acceptedPrimaryQty;
    dto.invoicedPrimaryQty = row.invoicedPrimaryQty;
    dto.openPrimaryQty = open.toNumber();
    dto.openQty = open.times(row.poUomQty).div(row.poPrimaryUomQty).toDecimalPlaces(3).toNumber();
    return dto;
  }
}

export type InvoiceableGoodsReceiptWithRatiosDto = InvoiceableGoodsReceiptDto & {
  displayUnitRatios: DisplayUnitRatios;
};
