import { useFormatters } from '@vritti/quantum-ui/hooks';
import { LineChart } from '@vritti/quantum-ui/LineChart';
import { pluralize } from '@vritti/quantum-ui/pluralize';
import { CalendarClock } from 'lucide-react';
import type React from 'react';
import { useMemo, useRef } from 'react';
import type { PriceWindow } from '@/schemas/suppliers';
import {
  buildPriceSeries,
  mergePriceSeries,
  type PriceRange,
  priceDomain,
  priceTrend,
  todayEpoch,
} from '@/utils/supplierPrice';
import { PriceTrendChip } from './PriceTrendChip';

// One line of the chart: a price timeline with the price in force, the one it replaced and the next change
export interface PriceSeries {
  id: string;
  label: string;
  current: PriceWindow | null;
  previous: PriceWindow | null;
  next: PriceWindow | null;
  windows: PriceWindow[];
}

interface PriceSeriesChartProps {
  series: PriceSeries[];
  currencyCode: string;
  // What one line stands for, e.g. "site" or "supplier"
  noun: string;
  // The window the chart shows; each line is cut to it
  range: PriceRange;
}

// The validated categorical series palette (quantum-ui --chart-series-1…8), in its fixed order
const SERIES = Array.from({ length: 8 }, (_, index) => `var(--chart-series-${index + 1})`);

// Several price timelines on one chart — a coloured step line each — with a key beneath that doubles as each line's
// ticker: the price in force, its last move and the next scheduled change
export const PriceSeriesChart: React.FC<PriceSeriesChartProps> = ({ series, currencyCode, noun, range }) => {
  const fmt = useFormatters();

  // A line keeps its colour while it stays on the chart — filtering others in or out never repaints it. Colours go to
  // lines as they appear, lowest free slot first; past eight the palette runs out and the rest wait.
  const slotsRef = useRef(new Map<string, number>());
  const shown = useMemo(() => {
    const slots = slotsRef.current;
    const visible = new Set(series.map((line) => line.id));
    for (const id of [...slots.keys()]) {
      if (!visible.has(id)) slots.delete(id);
    }
    for (const line of series) {
      if (slots.has(line.id)) continue;
      const taken = new Set(slots.values());
      const free = SERIES.findIndex((_, index) => !taken.has(index));
      if (free >= 0) slots.set(line.id, free);
    }
    return series.flatMap((line) => {
      const slot = slots.get(line.id);
      return slot == null ? [] : [{ ...line, slot }];
    });
  }, [series]);

  const today = new Date().toISOString().slice(0, 10);
  const todayInRange = range.from <= today && today <= range.to;

  const { rows, config, lines, yDomain } = useMemo(() => {
    const pointsByKey: Record<string, ReturnType<typeof buildPriceSeries>> = {};
    const chartConfig: Record<string, { label: string; color: string }> = {};
    for (const line of shown) {
      const key = `line${line.slot}`;
      pointsByKey[key] = buildPriceSeries(line.windows, range);
      chartConfig[key] = { label: line.label, color: SERIES[line.slot] };
    }
    return {
      yDomain: priceDomain(Object.values(pointsByKey).flatMap((points) => points.map((point) => point.unitPrice))),
      rows: mergePriceSeries(pointsByKey),
      config: chartConfig,
      // Alternate colour slots draw dashed, so a line whose prices match another's shows both colours instead of
      // hiding; the pattern follows the line's slot, so filtering never restyles a line that stays
      lines: shown.map((line) => ({
        dataKey: `line${line.slot}`,
        type: 'stepAfter' as const,
        dot: true,
        strokeDasharray: line.slot % 2 === 1 ? '6 4' : undefined,
      })),
    };
  }, [shown, range]);

  return (
    <div className="flex flex-col gap-4 rounded-lg border border-border p-4">
      <LineChart
        data={rows}
        config={config}
        xAxisKey="at"
        xAxisType="time"
        lines={lines}
        showLegend={false}
        yDomain={yDomain}
        markers={todayInRange ? [{ x: todayEpoch(), label: 'Today' }] : []}
        className="min-h-80 w-full"
        valueFormatter={(value) => String(fmt.currency({ currency: currencyCode, value: String(value) }).primary)}
        xAxisFormatter={(value) => String(fmt.date(new Date(Number(value)).toISOString().slice(0, 10)).primary)}
      />

      {shown.length < series.length && (
        <p className="text-xs text-muted-foreground">
          The chart draws up to {pluralize(noun, SERIES.length, true)} at once — narrow the filter to see the rest.
        </p>
      )}

      <ul className="grid grid-cols-1 gap-x-8 gap-y-3 border-t border-border pt-4 sm:grid-cols-2 xl:grid-cols-3">
        {shown.map((line) => {
          const trend = priceTrend(line.current ?? undefined, line.previous ?? undefined);
          return (
            <li key={line.id} className="flex items-start gap-3">
              <span
                className="mt-1.5 size-2.5 shrink-0 rounded-full"
                style={{ backgroundColor: SERIES[line.slot] }}
                aria-hidden
              />
              <div className="flex min-w-0 flex-1 flex-col gap-1">
                <div className="flex items-baseline justify-between gap-3">
                  <span className="truncate text-sm font-medium text-foreground">{line.label}</span>
                  <span className="text-sm font-semibold tabular-nums text-foreground">
                    {line.current ? fmt.currency(line.current.unitPrice).primary : '—'}
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                  {trend && <PriceTrendChip trend={trend} />}
                  {!line.current && <span>No price in force</span>}
                  {line.next && (
                    <span className="flex items-center gap-1">
                      <CalendarClock className="size-3" aria-hidden />
                      Next {fmt.currency(line.next.unitPrice).primary} from {fmt.date(line.next.validFrom).primary}
                    </span>
                  )}
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
};
