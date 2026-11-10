import type { ChartEmptyState } from '@vritti/quantum-ui/Chart';
import type { ContextStateInstance } from '@vritti/quantum-ui/ContextBar';
import { addMonths, format, parseISO, subMonths } from '@vritti/quantum-ui/date-fns';
import type { LineChartSelection } from '@vritti/quantum-ui/LineChart';
import type {
  InventoryItemPriceHistory,
  PriceHistoryLine,
  SitePriceHistory,
  SupplierItemPriceHistory,
  SupplierItemPriceRow,
} from '@/schemas/suppliers';

// Mirrors the backend frozen-row rule: a price whose start date has arrived only accepts a new end date
export function isPriceInForce(price: Pick<SupplierItemPriceRow, 'validFrom'>, today: string): boolean {
  return price.validFrom <= today;
}

export interface PricePoint {
  at: number;
  unitPrice: number | null;
}

const DAY_MS = 86_400_000;

function toEpoch(date: string): number {
  return Date.parse(`${date}T00:00:00Z`);
}

// A YYYY-MM-DD day on the price charts' time axis
export function dayEpoch(date: string): number {
  return toEpoch(date);
}

// The window a price chart shows, as YYYY-MM-DD dates
export interface PriceRange {
  from: string;
  to: string;
}

// What a price chart says inside its frame when no price falls in its window
export const NO_PRICES_IN_RANGE: ChartEmptyState = {
  title: 'No prices in this period',
  description: 'Widen the date range, or add a price on the Prices tab.',
};

// The default chart window: two months back to one month ahead, so recent moves and scheduled changes both show
export function defaultPriceRange(today: string): PriceRange {
  const day = parseISO(today);
  return { from: format(subMonths(day, 2), 'yyyy-MM-dd'), to: format(addMonths(day, 1), 'yyyy-MM-dd') };
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
  range: PriceRange,
): PricePoint[] {
  const sorted = [...prices].sort((a, b) => a.validFrom.localeCompare(b.validFrom));
  const openUntil = toEpoch(range.to);
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

// The window a price chart's context bar picked, else the default around today
export function contextPriceRange(context: ContextStateInstance, today: string): PriceRange {
  const fallback = defaultPriceRange(today);
  const [from = fallback.from, to = fallback.to] = context.contextValues('period');
  return { from, to };
}

// A price chart's rows and series: a step series per priced line over the window, with today marked when it falls in it
function selectPriceLines<TLine extends { id: string; label: string; windows: Parameters<typeof buildPriceSeries>[0] }>(
  lines: TLine[],
  range: PriceRange,
  today: string,
): LineChartSelection<TLine> {
  const pointsByLine = Object.fromEntries(lines.map((line) => [line.id, buildPriceSeries(line.windows, range)]));
  return {
    rows: mergePriceSeries(pointsByLine),
    series: lines,
    yDomain: priceDomain(Object.values(pointsByLine).flatMap((points) => points.map((point) => point.unitPrice))),
    xDomain: [dayEpoch(range.from), dayEpoch(range.to)],
    markers: range.from <= today && today <= range.to ? [{ x: dayEpoch(today), label: 'Today' }] : [],
  };
}

export type ItemPriceHistorySelection = LineChartSelection<PriceHistoryLine> & { currency: string };

// An inventory item's price history as a chart: a line per supplier item over the context's window
export function selectItemPriceHistory(
  data: InventoryItemPriceHistory,
  context: ContextStateInstance,
  today: string,
): ItemPriceHistorySelection {
  return { ...selectPriceLines(data.lines, contextPriceRange(context, today), today), currency: data.currency ?? '' };
}

export type SitePriceLine = SitePriceHistory & { id: string; label: string };
export type SitePriceHistorySelection = LineChartSelection<SitePriceLine> & { currency: string };

// A supplier item's price history as a chart: a line per site, by site name, over the context's window
export function selectSitePriceHistory(
  data: SupplierItemPriceHistory,
  context: ContextStateInstance,
  today: string,
): SitePriceHistorySelection {
  const lines = data.sites
    .map((site) => ({ ...site, id: site.siteId, label: site.siteName ?? site.siteCode ?? site.siteId }))
    .sort((a, b) => a.label.localeCompare(b.label));
  return { ...selectPriceLines(lines, contextPriceRange(context, today), today), currency: data.currency ?? '' };
}
