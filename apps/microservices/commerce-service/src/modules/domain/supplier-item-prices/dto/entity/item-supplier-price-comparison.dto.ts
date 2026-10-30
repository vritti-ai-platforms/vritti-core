import { CurrencyAmountDto } from '@vritti/api-sdk/money';

// One supplier item's standing for an inventory item at a site on a date: the price in force in its own unit and per the
// item's primary unit, what the scheme makes it cost, and how it last moved
export class ItemSupplierPriceComparisonDto {
  supplierItemId: string;
  supplierId: string;
  supplierName: string;
  supplierCode: string;
  // The unit the supplier quotes the item in
  quotedUomSymbol: string | null;
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
}
