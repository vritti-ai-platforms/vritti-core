import { Card, CardContent, CardHeader, CardTitle } from '@vritti/quantum-ui/Card';
import { useFormatters } from '@vritti/quantum-ui/hooks';
import { pluralize } from '@vritti/quantum-ui/pluralize';
import { CalendarClock } from 'lucide-react';
import type React from 'react';
import { useMemo } from 'react';
import type { SitePriceHistory } from '@/schemas/suppliers';
import { buildPriceSeries, type PriceRange, priceTrend } from '@/utils/supplierPrice';
import { PriceStepChart } from './PriceStepChart';
import { PriceTrendChip } from './PriceTrendChip';

interface PriceTimelineCardProps {
  title: string;
  site: SitePriceHistory;
  currencyCode: string;
  // Controls beside the title, e.g. the currency filter
  action?: React.ReactNode;
  // The window the chart shows; the line is cut to it
  range: PriceRange;
}

// One site's price history: the price in force leads, its last move and next scheduled change follow, the chart below
export const PriceTimelineCard: React.FC<PriceTimelineCardProps> = ({ title, site, currencyCode, action, range }) => {
  const fmt = useFormatters();
  const points = useMemo(() => buildPriceSeries(site.windows, range), [site.windows, range]);
  const { current, previous, next } = site;
  const trend = priceTrend(current ?? undefined, previous ?? undefined);

  return (
    <Card>
      <CardHeader className="gap-2">
        <div className="flex items-center justify-between gap-2">
          <CardTitle>{title}</CardTitle>
          {action}
        </div>
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
          {current ? (
            <span className="text-2xl font-semibold tabular-nums text-foreground">
              {fmt.currency(current.unitPrice).primary}
            </span>
          ) : (
            <span className="text-base font-medium text-muted-foreground">No price in force</span>
          )}
          {trend && current && <PriceTrendChip trend={trend} since={current.validFrom} />}
        </div>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
          {next && (
            <span className="flex items-center gap-1.5">
              <CalendarClock className="size-3.5" aria-hidden />
              Next {fmt.currency(next.unitPrice).primary} from {fmt.date(next.validFrom).primary}
            </span>
          )}
          <span>{pluralize('price', site.windows.length, true)} in this period</span>
        </div>
      </CardHeader>
      <CardContent>
        <PriceStepChart points={points} currencyCode={currencyCode} className="min-h-72 w-full" />
      </CardContent>
    </Card>
  );
};
