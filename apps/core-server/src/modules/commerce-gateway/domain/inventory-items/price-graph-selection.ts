import type { TableViewState } from '@vritti/api-sdk/data-table';

// What a price graph shows, as saved in its live table state: the site (legal entity only), the date window, the
// suppliers drawn (none lets the server pick) and the MRPs the prices were agreed against (none means any)
export interface PriceGraphSelection {
  siteId: string | null;
  from: string;
  to: string;
  supplierIds: string[];
  mrpIds: string[];
  currency: string | null;
}

// The default window: two months back to one month ahead, so recent moves and scheduled changes both show
function defaultWindow(): { from: string; to: string } {
  const today = new Date();
  const shift = (months: number) =>
    new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth() + months, today.getUTCDate()))
      .toISOString()
      .slice(0, 10);
  return { from: shift(-2), to: shift(1) };
}

// Reads a price graph's selection from its saved state, filling the window when none is saved
export function readPriceGraphSelection(state: TableViewState): PriceGraphSelection {
  const value = (field: string) => state.filters?.find((filter) => filter.field === field)?.value;
  const text = (field: string) => {
    const raw = value(field);
    return typeof raw === 'string' && raw ? raw : null;
  };
  const list = (field: string) => {
    const raw = value(field);
    return Array.isArray(raw) ? raw.map(String) : [];
  };
  const window = defaultWindow();
  return {
    siteId: text('siteId'),
    from: text('from') ?? window.from,
    to: text('to') ?? window.to,
    supplierIds: list('supplierIds'),
    mrpIds: list('mrpIds'),
    currency: text('currency'),
  };
}
