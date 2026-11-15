import Decimal from '@vritti/quantum-ui/decimal';
import { groupBy } from '@vritti/quantum-ui/lodash';
import type { PurchaseQuotation, PurchaseQuotationItem, PurchaseSourcingItem } from '@/schemas/purchases';

export interface SourcingQuote {
  quotation: PurchaseQuotation;
  line: PurchaseQuotationItem;
  isBest: boolean;
}

export interface SourcingRow {
  item: PurchaseSourcingItem;
  quotes: SourcingQuote[];
}

// An item's posted quotation lines, the cheapest per primary unit marked in each currency
function itemQuotes(quotations: PurchaseQuotation[], item: PurchaseSourcingItem): SourcingQuote[] {
  const lines = quotations
    .filter((quotation) => quotation.isPosted)
    .flatMap((quotation) =>
      quotation.items
        .filter((line) => line.inventoryItemId === item.inventoryItemId)
        .map((line) => ({ quotation, line })),
    );
  const byCurrency = groupBy(lines, ({ line }) => line.unitPricePerPrimary.currency);
  const bestIds = new Set(
    Object.values(byCurrency).map(
      (quotes) =>
        quotes.reduce((best, quote) =>
          new Decimal(quote.line.unitPricePerPrimary.value).lessThan(best.line.unitPricePerPrimary.value)
            ? quote
            : best,
        ).line.id,
    ),
  );
  return lines.map((quote) => ({ ...quote, isBest: lines.length > 1 && bestIds.has(quote.line.id) }));
}

// One row per purchase item with the quotes it received; its allocations come with the item
export function buildSourcingRows(items: PurchaseSourcingItem[], quotations: PurchaseQuotation[]): SourcingRow[] {
  return items.map((item) => ({ item, quotes: itemQuotes(quotations, item) }));
}
