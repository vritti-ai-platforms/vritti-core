import { CurrencyAmountDto } from '@vritti/api-sdk/money';
import type { ItemSupplierPriceComparisonRow } from '../../repositories/item-supplier-price-comparisons.repository';

// One supplier item's standing for an inventory item at a site on a date: the price in force in its own unit and per the
// item's primary unit, what the scheme makes it cost, and how it last moved
export class ItemSupplierPriceComparisonDto {
  supplierItemId: string;
  supplierId: string;
  supplierName: string;
  supplierCode: string;
  // The unit the supplier quotes the item in
  quotedUomSymbol: string;
  isPreferred: boolean;
  // The price in force on the date, per the quoted unit, and its window
  currentPrice: CurrencyAmountDto | null;
  currentFrom: string | null;
  currentTo: string | null;
  // The price in force after its free-goods scheme, per the quoted unit
  effectivePrice: CurrencyAmountDto | null;
  // The price in force per the item's primary unit, before and after its free-goods scheme
  pricePerPrimary: CurrencyAmountDto | null;
  effectivePricePerPrimary: CurrencyAmountDto | null;
  schemeBuyQty: number | null;
  schemeFreeQty: number | null;
  mrp: CurrencyAmountDto | null;
  // The price the current one replaced, and the move between them in percent (same currency only)
  previousPrice: CurrencyAmountDto | null;
  changePercent: number | null;
  // Price windows on record at the site
  priceCount: number;

  // Maps a comparison row; a figure with no price in force behind it is null
  static from(row: ItemSupplierPriceComparisonRow): ItemSupplierPriceComparisonDto {
    const money = (amount: bigint | null, currencyCode: string | null) =>
      amount != null && currencyCode ? CurrencyAmountDto.from(amount, currencyCode) : null;
    const dto = new ItemSupplierPriceComparisonDto();
    dto.supplierItemId = row.supplierItemId;
    dto.supplierId = row.supplierId;
    dto.supplierName = row.supplierName;
    dto.supplierCode = row.supplierCode;
    dto.quotedUomSymbol = row.quotedUomSymbol;
    dto.isPreferred = row.isPreferred;
    dto.currentPrice = money(row.currentPrice, row.currencyCode);
    dto.currentFrom = row.currentFrom;
    dto.currentTo = row.currentTo;
    dto.effectivePrice = money(row.effectivePrice, row.currencyCode);
    dto.pricePerPrimary = money(row.pricePerPrimary, row.currencyCode);
    dto.effectivePricePerPrimary = money(row.effectivePricePerPrimary, row.currencyCode);
    dto.schemeBuyQty = row.schemeBuyQty;
    dto.schemeFreeQty = row.schemeFreeQty;
    dto.mrp = money(row.mrpAmount, row.currencyCode);
    dto.previousPrice = money(row.previousPrice, row.previousCurrencyCode);
    dto.changePercent = row.changePercent;
    dto.priceCount = row.priceCount;
    return dto;
  }
}
