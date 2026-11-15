import { CurrencyAmountDto } from '@vritti/api-sdk/money';
import type { PurchaseQuotationItemRow, PurchaseQuotationRow } from '../../repositories/supplier-quotations.repository';

export class PurchaseQuotationItemDto {
  id: string;
  purchaseItemId: string | null;
  inventoryItemId: string;
  inventoryItemName: string;
  uomId: string;
  uomSymbol: string | null;
  unitPrice: CurrencyAmountDto;
  schemeBuyQty: number | null;
  schemeFreeQty: number | null;

  // Maps a quotation line of a purchase, priced in its own unit
  static from(row: PurchaseQuotationItemRow): PurchaseQuotationItemDto {
    const dto = new PurchaseQuotationItemDto();
    dto.id = row.id;
    dto.purchaseItemId = row.purchaseItemId;
    dto.inventoryItemId = row.inventoryItemId;
    dto.inventoryItemName = row.inventoryItemName;
    dto.uomId = row.uomId;
    dto.uomSymbol = row.uomSymbol;
    dto.unitPrice = CurrencyAmountDto.from(row.unitPrice, row.currencyCode);
    dto.schemeBuyQty = row.schemeBuyQty;
    dto.schemeFreeQty = row.schemeFreeQty;
    return dto;
  }
}

export class PurchaseQuotationDto {
  id: string;
  quotationNumber: string;
  supplierId: string;
  supplierName: string;
  // Posted to the purchase's site or to its whole legal entity
  isPosted: boolean;
  validFrom: string;
  validTo: string | null;
  currencyCode: string;
  pricedItemCount: number;
  itemCount: number;
  items: PurchaseQuotationItemDto[];

  // Maps a quotation a purchase requested with its lines; a line is priced once its unit price is above zero
  static from(row: PurchaseQuotationRow, items: PurchaseQuotationItemRow[]): PurchaseQuotationDto {
    const dto = new PurchaseQuotationDto();
    dto.id = row.id;
    dto.quotationNumber = row.quotationNumber;
    dto.supplierId = row.supplierId;
    dto.supplierName = row.supplierName;
    dto.isPosted = row.isPosted;
    dto.validFrom = row.validFrom;
    dto.validTo = row.validTo;
    dto.currencyCode = row.currencyCode;
    dto.pricedItemCount = items.filter((item) => item.unitPrice > 0n).length;
    dto.itemCount = items.length;
    dto.items = items.map(PurchaseQuotationItemDto.from);
    return dto;
  }
}
