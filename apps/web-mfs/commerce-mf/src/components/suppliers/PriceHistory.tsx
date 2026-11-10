import { useQueryClient } from '@tanstack/react-query';
import { ChartKey, useChart } from '@vritti/quantum-ui/Chart';
import { ContextBar, type ContextStateInstance } from '@vritti/quantum-ui/ContextBar';
import { DateRangeFilter } from '@vritti/quantum-ui/DateRangePicker';
import { filter } from '@vritti/quantum-ui/filter';
import { useFormatters, useWorkspaceTimeZone } from '@vritti/quantum-ui/hooks';
import { LineChart } from '@vritti/quantum-ui/LineChart';
import { CurrencyFilter } from '@vritti/quantum-ui/selects/currency';
import { isoTodayDate } from '@vritti/quantum-ui/timezone';
import type React from 'react';
import { useCallback, useMemo } from 'react';
import type { SupplierItemPriceHistory } from '@/schemas/suppliers';
import { EnrolledSiteFilter } from '@/selectors/enrolled-site';
import { defaultPriceRange, NO_PRICES_IN_RANGE, selectSitePriceHistory } from '@/utils/supplierPrice';
import type { SupplierItemPricesBinding } from './bindings';
import { PriceKeyDetail } from './PriceKeyDetail';

interface PriceHistoryProps {
  prices: SupplierItemPricesBinding;
  supplierId: string;
  itemId: string;
  currencyCode: string;
  siteId?: string;
}

// A supplier item's price history in one currency, at the context saved in its context bar: a line per site on one chart,
// and a key below with each site's price in force
export const PriceHistory: React.FC<PriceHistoryProps> = ({ prices, supplierId, itemId, currencyCode, siteId }) => {
  const queryClient = useQueryClient();
  const fmt = useFormatters();
  const today = isoTodayDate(useWorkspaceTimeZone(siteId));
  const defaultRange = useMemo(() => defaultPriceRange(today), [today]);
  const historyQuery = prices.usePriceHistoryQuery(supplierId, itemId);

  const select = useCallback(
    (data: SupplierItemPriceHistory, context: ContextStateInstance) => selectSitePriceHistory(data, context, today),
    [today],
  );
  const chart = useChart({
    query: historyQuery,
    select,
    slug: prices.priceHistorySlug(supplierId, itemId),
    defaultContext: [
      filter('period').between(defaultRange.from, defaultRange.to),
      filter('currency').equals(currencyCode),
    ],
    onStatePush: () => queryClient.invalidateQueries({ queryKey: prices.priceHistoryKey(supplierId, itemId) }),
  });
  const currency = chart.view?.currency ?? currencyCode;

  return (
    <div className="flex flex-col gap-4">
      <LineChart
        chart={chart}
        contextBar={
          <ContextBar state={chart.context} className="justify-end">
            <CurrencyFilter name="currency" mode="context" clearable={false} selectFirst />
            {prices.spansSites && (
              <EnrolledSiteFilter
                name="sites"
                label="Sites"
                placeholder="All sites"
                mode="context"
                multiple
                supplierId={supplierId}
              />
            )}
            <DateRangeFilter name="period" label="Period" mode="context" />
          </ContextBar>
        }
        xAxisKey="at"
        xAxisType="time"
        curve="stepAfter"
        dot
        dashAlternate
        showLegend={false}
        emptyState={NO_PRICES_IN_RANGE}
        valueFormatter={(value) => String(fmt.currency({ currency, value: String(value) }).primary)}
        xAxisFormatter={(value) => String(fmt.date(new Date(Number(value)).toISOString().slice(0, 10)).primary)}
      />
      <ChartKey
        chart={chart}
        title="Prices in Force"
        value={(site) => (site.current ? fmt.currency(site.current.unitPrice).primary : '—')}
        detail={(site) => <PriceKeyDetail price={site} />}
      />
    </div>
  );
};
