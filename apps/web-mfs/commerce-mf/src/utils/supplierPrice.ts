import type { PriceGraphSelection, PriceWindow, SupplierItemPriceRow } from '@/schemas/suppliers';

// Mirrors the backend frozen-row rule: a price whose start date has arrived only accepts a new end date
export function isPriceInForce(price: Pick<SupplierItemPriceRow, 'validFrom'>): boolean {
  return price.validFrom <= new Date().toISOString().slice(0, 10);
}

export interface PricePoint {
  at: number;
  unitPrice: number | null;
}

const DAY_MS = 86_400_000;

function toEpoch(date: string): number {
  return Date.parse(`${date}T00:00:00Z`);
}

// Today on the price charts' time axis
export function todayEpoch(): number {
  return toEpoch(new Date().toISOString().slice(0, 10));
}

// The window a price chart shows, as YYYY-MM-DD dates
export interface PriceRange {
  from: string;
  to: string;
}

// The live table state a price graph saves its selection as — the same store DataTables use, read back by the graph's
// endpoint
export function priceGraphState(selection: PriceGraphSelection) {
  const filters = [
    ...(selection.siteId ? [{ field: 'siteId', operator: 'equals', value: selection.siteId }] : []),
    { field: 'from', operator: 'gte', value: selection.from },
    { field: 'to', operator: 'lte', value: selection.to },
    ...(selection.supplierIds.length
      ? [{ field: 'supplierIds', operator: 'isAnyOf', value: selection.supplierIds }]
      : []),
    ...(selection.mrpIds.length ? [{ field: 'mrpIds', operator: 'isAnyOf', value: selection.mrpIds }] : []),
    ...(selection.currency ? [{ field: 'currency', operator: 'equals', value: selection.currency }] : []),
  ];
  return {
    filters,
    sort: [],
    columnVisibility: {},
    columnOrder: [],
    columnSizing: {},
    columnPinning: { left: [], right: [] },
    lockedColumnSizing: false,
    density: 'normal',
    filterOrder: [],
    filterVisibility: {},
    search: null,
    pagination: { limit: 20, offset: 0 },
  };
}

// The default chart window: two months back to one month ahead, so recent moves and scheduled changes both show
export function defaultPriceRange(): PriceRange {
  const today = new Date();
  const shift = (months: number) =>
    new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth() + months, today.getUTCDate()))
      .toISOString()
      .slice(0, 10);
  return { from: shift(-2), to: shift(1) };
}

// The value a step series holds at an instant: its last point at or before it
function valueAt(points: PricePoint[], at: number): number | null {
  let value: number | null = null;
  for (const point of points) {
    if (point.at > at) break;
    value = point.unitPrice;
  }
  return value;
}

// Turns a site's price timeline into step points: each window holds until its end date and a gap opens where no price
// follows. The open-ended price runs to today, or to the end of the window when one is given; with a window the line is
// cut to it, starting and ending on the price in force at its edges.
export function buildPriceSeries(
  prices: Pick<SupplierItemPriceRow, 'unitPrice' | 'validFrom' | 'validTo'>[],
  range?: PriceRange,
): PricePoint[] {
  const sorted = [...prices].sort((a, b) => a.validFrom.localeCompare(b.validFrom));
  const openUntil = range ? toEpoch(range.to) : todayEpoch();
  const points: PricePoint[] = [];

  sorted.forEach((price, index) => {
    const amount = Number(price.unitPrice.value);
    const start = toEpoch(price.validFrom);
    points.push({ at: start, unitPrice: amount });

    const next = sorted[index + 1];
    if (price.validTo) {
      const end = toEpoch(price.validTo);
      points.push({ at: end, unitPrice: amount });
      if (!next || toEpoch(next.validFrom) > end + DAY_MS) points.push({ at: end + DAY_MS, unitPrice: null });
    } else if (!next && openUntil > start) {
      points.push({ at: openUntil, unitPrice: amount });
    }
  });

  if (!range) return points;
  const from = toEpoch(range.from);
  const to = toEpoch(range.to);
  return [
    { at: from, unitPrice: valueAt(points, from) },
    ...points.filter((point) => point.at > from && point.at < to),
    { at: to, unitPrice: valueAt(points, to) },
  ];
}

export type PriceTrend = { direction: 'up' | 'down' | 'flat'; percent: number };

// How the price in force moved against the one it replaced, or null when there is nothing to compare
export function priceTrend(
  current: Pick<SupplierItemPriceRow, 'unitPrice'> | undefined,
  previous: Pick<SupplierItemPriceRow, 'unitPrice'> | undefined,
): PriceTrend | null {
  if (!current || !previous) return null;
  const before = Number(previous.unitPrice.value);
  if (!before) return null;
  const percent = ((Number(current.unitPrice.value) - before) / before) * 100;
  return { direction: percent > 0 ? 'up' : percent < 0 ? 'down' : 'flat', percent: Math.abs(percent) };
}

// A value axis padded around the prices, but never zoomed closer than ±10% of the price level, so a move of a paisa
// on a ₹241 price stays flat while a real move still fills the chart; the ends land on round prices
export function priceDomain(values: (number | null | undefined)[]): [number, number] | undefined {
  const present = values.filter((value): value is number => value != null);
  if (present.length === 0) return undefined;
  const min = Math.min(...present);
  const max = Math.max(...present);
  const mid = (min + max) / 2;
  const half = Math.max(((max - min) / 2) * 1.3, mid * 0.1, 0.5);
  const low = Math.max(0, mid - half);
  const high = mid + half;
  const step = 10 ** Math.floor(Math.log10(high - low)) / 2;
  return [Math.max(0, Math.floor(low / step) * step), Math.ceil(high / step) * step];
}

// Merges several step series onto one timeline: at each instant every series carries the value it held then (its
// last point at or before it), or null where it had no price — so one chart can draw a line per series
export function mergePriceSeries(series: Record<string, PricePoint[]>): Record<string, number | null>[] {
  const times = [...new Set(Object.values(series).flatMap((points) => points.map((point) => point.at)))].sort(
    (a, b) => a - b,
  );
  return times.map((at) => {
    const row: Record<string, number | null> = { at };
    for (const [key, points] of Object.entries(series)) {
      let value: number | null = null;
      for (const point of points) {
        if (point.at > at) break;
        value = point.unitPrice;
      }
      row[key] = value;
    }
    return row;
  });
}

// A price timeline: its windows (ascending by validFrom) and the price in force, the one before it and the next change
export interface PriceTimeline {
  current: PriceWindow | null;
  previous: PriceWindow | null;
  next: PriceWindow | null;
  windows: PriceWindow[];
}

// The currencies the timelines are priced in — those in force first, then the most recently quoted
export function priceCurrencies(timelines: PriceTimeline[]): string[] {
  const latest = new Map<string, string>();
  for (const window of timelines.flatMap((timeline) => timeline.windows)) {
    const seen = latest.get(window.unitPrice.currency);
    if (!seen || window.validFrom > seen) latest.set(window.unitPrice.currency, window.validFrom);
  }
  const inForce = new Set(
    timelines.flatMap((timeline) => (timeline.current ? [timeline.current.unitPrice.currency] : [])),
  );
  return [...latest.keys()].sort(
    (a, b) =>
      Number(inForce.has(b)) - Number(inForce.has(a)) || (latest.get(b) ?? '').localeCompare(latest.get(a) ?? ''),
  );
}

// A timeline narrowed to one currency, with the price in force, the one it replaced and the next change found again
// among its windows, so a trend never compares two currencies
export function inCurrency<T extends PriceTimeline>(timeline: T, currency: string): T {
  const today = new Date().toISOString().slice(0, 10);
  const windows = timeline.windows.filter((window) => window.unitPrice.currency === currency);
  const currentIndex = windows.findIndex(
    (window) => window.validFrom <= today && (!window.validTo || window.validTo >= today),
  );
  return {
    ...timeline,
    windows,
    current: currentIndex >= 0 ? windows[currentIndex] : null,
    previous: currentIndex > 0 ? windows[currentIndex - 1] : null,
    next: windows.find((window) => window.validFrom > today) ?? null,
  };
}
