import { CurrencyAmountDto } from '@vritti/api-sdk/money';
import type { SupplierInvoiceLineType } from '@/db/schema';
import type { SupplierInvoiceLineRow } from '../../repositories/supplier-invoice-lines.repository';
import type { SupplierInvoiceHoldDto } from './supplier-invoice-hold.dto';

export class SupplierInvoiceLineDto {
  id: string;
  supplierInvoiceId: string;
  lineType: SupplierInvoiceLineType;
  purchaseOrderItemId: string | null;
  purchaseOrderId: string | null;
  poNumber: string | null;
  goodsReceiptItemId: string | null;
  goodsReceiptId: string | null;
  grNumber: string | null;
  goodsReceiptLotId: string | null;
  lotNumber: string | null;
  expiryDate: string | null;
  mrp: CurrencyAmountDto;
  inventoryItemId: string | null;
  inventoryItemName: string | null;
  uomId: string | null;
  uomSymbol: string | null;
  primaryUomSymbol: string | null;
  invoicedQty: number | null;
  freeQty: number | null;
  invoicedPrimaryQty: number | null;
  freePrimaryQty: number | null;
  costCategoryId: string | null;
  costCategoryName: string | null;
  description: string | null;
  unitPrice: CurrencyAmountDto;
  discountAmount: CurrencyAmountDto;
  taxAmount: CurrencyAmountDto;
  lineTotal: CurrencyAmountDto;
  varianceAmount: CurrencyAmountDto;
  holds: SupplierInvoiceHoldDto[];

  // Shapes a line; its batch, expiry and MRP are the receipt lot's, the MRP in the legal entity's currency
  static from(
    row: SupplierInvoiceLineRow,
    holds: SupplierInvoiceHoldDto[],
    currencyCode: string,
    leCurrencyCode: string,
  ): SupplierInvoiceLineDto {
    const dto = new SupplierInvoiceLineDto();
    dto.id = row.id;
    dto.supplierInvoiceId = row.supplierInvoiceId;
    dto.lineType = row.lineType;
    dto.purchaseOrderItemId = row.purchaseOrderItemId;
    dto.purchaseOrderId = row.purchaseOrderId;
    dto.poNumber = row.poNumber;
    dto.goodsReceiptItemId = row.goodsReceiptItemId;
    dto.goodsReceiptId = row.goodsReceiptId;
    dto.grNumber = row.grNumber;
    dto.goodsReceiptLotId = row.goodsReceiptLotId;
    dto.lotNumber = row.lotNumber;
    dto.expiryDate = row.expiryDate;
    dto.mrp = CurrencyAmountDto.from(row.mrp ?? 0n, leCurrencyCode);
    dto.inventoryItemId = row.inventoryItemId;
    dto.inventoryItemName = row.inventoryItemName;
    dto.uomId = row.uomId;
    dto.uomSymbol = row.uomSymbol;
    dto.primaryUomSymbol = row.primaryUomSymbol;
    dto.invoicedQty = row.invoicedQty;
    dto.freeQty = row.freeQty;
    dto.invoicedPrimaryQty = row.invoicedPrimaryQty;
    dto.freePrimaryQty = row.freePrimaryQty;
    dto.costCategoryId = row.costCategoryId;
    dto.costCategoryName = row.costCategoryName;
    dto.description = row.description;
    dto.unitPrice = CurrencyAmountDto.from(row.unitPrice, currencyCode);
    dto.discountAmount = CurrencyAmountDto.from(row.discountAmount, currencyCode);
    dto.taxAmount = CurrencyAmountDto.from(row.taxAmount, currencyCode);
    dto.lineTotal = CurrencyAmountDto.from(row.lineTotal, currencyCode);
    dto.varianceAmount = CurrencyAmountDto.from(row.varianceAmount, leCurrencyCode);
    dto.holds = holds;
    return dto;
  }
}
