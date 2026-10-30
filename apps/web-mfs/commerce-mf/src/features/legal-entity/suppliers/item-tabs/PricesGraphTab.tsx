import { Empty } from '@vritti/quantum-ui/Empty';
import { pluralize } from '@vritti/quantum-ui/pluralize';
import { Select } from '@vritti/quantum-ui/Select';
import { Skeleton } from '@vritti/quantum-ui/Skeleton';
import { LineChart as LineChartIcon } from 'lucide-react';
import type React from 'react';
import { useMemo, useState } from 'react';
import { PriceCurrencyFilter } from '@/components/suppliers/PriceCurrencyFilter';
import { PriceRangePicker } from '@/components/suppliers/PriceRangePicker';
import { type SitePrices, SitePricesChart } from '@/components/suppliers/SitePricesChart';
import { usePriceCurrency } from '@/components/suppliers/usePriceCurrency';
import { useSupplierItemPriceHistory } from '@/hooks/legal-entity/suppliers';
import { defaultPriceRange, inCurrency } from '@/utils/supplierPrice';

interface PricesGraphTabProps {
  supplierId: string;
  itemId: string;
  // The supplier's default currency, the chart's until prices load
  currencyCode: string;
  addButton: React.ReactNode;
}

// The item's prices across its sites — one chart, a coloured step line per site, narrowed by a site filter and shown in
// one currency at a time
export const PricesGraphTab: React.FC<PricesGraphTabProps> = ({ supplierId, itemId, currencyCode, addButton }) => {
  const [pickedSiteIds, setPickedSiteIds] = useState<string[]>([]);
  const [range, setRange] = useState(defaultPriceRange);
  const { data: history, isLoading } = useSupplierItemPriceHistory(supplierId, itemId, range);

  const sites = useMemo<SitePrices[]>(
    () =>
      (history?.sites ?? [])
        .map((site) => ({ ...site, siteName: site.siteName ?? site.siteCode ?? site.siteId }))
        .sort((a, b) => a.siteName.localeCompare(b.siteName)),
    [history],
  );

  const { currencies, currency, setCurrency } = usePriceCurrency(sites);
  const filtered = useMemo(() => {
    const picked = new Set(pickedSiteIds);
    return sites
      .filter((site) => picked.size === 0 || picked.has(site.siteId))
      .map((site) => (currency ? inCurrency(site, currency) : site))
      .filter((site) => site.windows.length > 0);
  }, [sites, pickedSiteIds, currency]);

  const siteOptions = useMemo(() => sites.map((site) => ({ value: site.siteId, label: site.siteName })), [sites]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-sm text-muted-foreground">
          {filtered.length < sites.length
            ? `Showing ${filtered.length} of ${pluralize('site', sites.length, true)}`
            : pluralize('site', sites.length, true)}
        </span>
        <div className="flex flex-wrap items-center gap-2">
          {currencies.length > 0 && (
            <PriceCurrencyFilter currencies={currencies} value={currency} onChange={setCurrency} />
          )}
          {sites.length > 1 && (
            <div className="w-56">
              <Select
                multiple
                placeholder="All sites"
                searchable
                maxDisplayedItems={1}
                options={siteOptions}
                value={pickedSiteIds}
                onChange={(values: unknown) => setPickedSiteIds(Array.isArray(values) ? values.map(String) : [])}
              />
            </div>
          )}
          <PriceRangePicker value={range} onChange={setRange} />
          {addButton}
        </div>
      </div>
      {isLoading ? (
        <Skeleton className="h-96 w-full" />
      ) : sites.length === 0 ? (
        <Empty
          icon={<LineChartIcon className="size-6" />}
          title="No prices in this period"
          description="No site has a price for this item in the selected dates. Widen the date range or add a price."
        />
      ) : filtered.length === 0 ? (
        <Empty
          icon={<LineChartIcon className="size-6" />}
          title="No prices match"
          description="No selected site has prices in this currency. Change the site or currency filter."
        />
      ) : (
        <SitePricesChart sites={filtered} currencyCode={currency ?? currencyCode} range={range} />
      )}
    </div>
  );
};
