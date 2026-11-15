import type { PurchaseQuotationItemTermsRow } from '../../repositories/supplier-quotations.repository';

export class PurchaseQuotationItemTermsDto {
  id: string;
  quotationId: string;
  supplierId: string;
  purchaseItemId: string | null;
  inventoryItemId: string;
  uomId: string;
  currencyCode: string;
  unitPrice: bigint;
  schemeBuyQty: number | null;
  schemeFreeQty: number | null;

  // Maps a posted quotation line to the terms an allocation copies; the price stays in minor units
  static from(row: PurchaseQuotationItemTermsRow): PurchaseQuotationItemTermsDto {
    const dto = new PurchaseQuotationItemTermsDto();
    dto.id = row.id;
    dto.quotationId = row.quotationId;
    dto.supplierId = row.supplierId;
    dto.purchaseItemId = row.purchaseItemId;
    dto.inventoryItemId = row.inventoryItemId;
    dto.uomId = row.uomId;
    dto.currencyCode = row.currencyCode;
    dto.unitPrice = row.unitPrice;
    dto.schemeBuyQty = row.schemeBuyQty;
    dto.schemeFreeQty = row.schemeFreeQty;
    return dto;
  }
}
