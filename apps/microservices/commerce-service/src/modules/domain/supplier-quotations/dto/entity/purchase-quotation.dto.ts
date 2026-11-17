import { CurrencyAmountDto } from '@vritti/api-sdk/money';
import { type WorkspaceScope, workspaceScopeOf } from '@/db/schema';
import type {
  PurchaseItemQuoteRow,
  PurchaseQuotationItemRow,
  PurchaseQuotationRow,
  PurchaseQuotationTableRow,
} from '../../repositories/supplier-quotations.repository';

export class PurchaseQuotationItemDto {
  id: string;
  purchaseItemId: string | null;
  inventoryItemId: string;
  inventoryItemName: string;
  uomId: string;
  uomSymbol: string;
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
  legalEntityId: string | null;
  siteId: string | null;
  ownerScope: WorkspaceScope;
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
    dto.legalEntityId = row.legalEntityId;
    dto.siteId = row.siteId;
    dto.ownerScope = workspaceScopeOf(row);
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

export class PurchaseQuotationTableRowDto {
  id: string;
  legalEntityId: string | null;
  siteId: string | null;
  ownerScope: WorkspaceScope;
  quotationNumber: string;
  supplierId: string;
  supplierName: string;
  isPosted: boolean;
  validFrom: string;
  validTo: string | null;
  currencyCode: string;
  pricedItemCount: number;
  itemCount: number;

  // Maps a quotation a purchase requested with how many of its lines are priced, without the lines
  static from(row: PurchaseQuotationTableRow): PurchaseQuotationTableRowDto {
    const dto = new PurchaseQuotationTableRowDto();
    dto.id = row.id;
    dto.legalEntityId = row.legalEntityId;
    dto.siteId = row.siteId;
    dto.ownerScope = workspaceScopeOf(row);
    dto.quotationNumber = row.quotationNumber;
    dto.supplierId = row.supplierId;
    dto.supplierName = row.supplierName;
    dto.isPosted = row.isPosted;
    dto.validFrom = row.validFrom;
    dto.validTo = row.validTo;
    dto.currencyCode = row.currencyCode;
    dto.pricedItemCount = row.pricedItemCount;
    dto.itemCount = row.itemCount;
    return dto;
  }
}

export class PurchaseItemQuotationLineDto {
  quotationId: string;
  quotationNumber: string;
  supplierId: string;
  supplierName: string;
  isPosted: boolean;
  validFrom: string;
  validTo: string | null;
  line: PurchaseQuotationItemDto;

  // Maps a line of a purchase's quotation that quotes one of its items, priced in its own unit
  static from(row: PurchaseItemQuoteRow): PurchaseItemQuotationLineDto {
    const dto = new PurchaseItemQuotationLineDto();
    dto.quotationId = row.quotationId;
    dto.quotationNumber = row.quotationNumber;
    dto.supplierId = row.supplierId;
    dto.supplierName = row.supplierName;
    dto.isPosted = row.isPosted;
    dto.validFrom = row.validFrom;
    dto.validTo = row.validTo;
    dto.line = PurchaseQuotationItemDto.from(row);
    return dto;
  }
}
