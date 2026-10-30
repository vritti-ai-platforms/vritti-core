import { Empty } from '@vritti/quantum-ui/Empty';
import { Skeleton } from '@vritti/quantum-ui/Skeleton';
import { LineChart as LineChartIcon } from 'lucide-react';
import type React from 'react';
import { useMemo, useState } from 'react';
import { defaultPriceRange, inCurrency } from '@/utils/supplierPrice';
import type { SupplierSiteBinding } from '../bindings';
import { PriceCurrencyFilter } from '../PriceCurrencyFilter';
import { PriceRangePicker } from '../PriceRangePicker';
import { PriceTimelineCard } from '../PriceTimelineCard';
import type { SupplierSiteRef } from '../types';
import { usePriceCurrency } from '../usePriceCurrency';

interface PriceGraphProps {
  binding: SupplierSiteBinding;
  supplierRef: SupplierSiteRef;
  itemId: string;
}

// The site's unit price over time in one currency, from the item's price history at that site
export const PriceGraph: React.FC<PriceGraphProps> = ({ binding, supplierRef, itemId }) => {
  const [range, setRange] = useState(defaultPriceRange);
  const { data: history, isLoading } = binding.useSitePriceHistory(supplierRef, itemId, range);
  const site = history?.sites[0];
  const timelines = useMemo(() => (site ? [site] : []), [site]);
  const { currencies, currency, setCurrency } = usePriceCurrency(timelines);

  if (isLoading) return <Skeleton className="h-96 w-full" />;
  if (!site || !currency) {
    return (
      <div className="flex flex-col gap-4">
        <div className="flex justify-end">
          <PriceRangePicker value={range} onChange={setRange} />
        </div>
        <Empty
          icon={<LineChartIcon className="size-6" />}
          title="No prices in this period"
          description="No price for this item at this site falls in the selected dates. Widen the date range."
        />
      </div>
    );
  }

  return (
    <PriceTimelineCard
      title="Price History"
      site={inCurrency(site, currency)}
      currencyCode={currency}
      range={range}
      action={
        <div className="flex flex-wrap items-center gap-2">
          <PriceCurrencyFilter currencies={currencies} value={currency} onChange={setCurrency} />
          <PriceRangePicker value={range} onChange={setRange} />
        </div>
      }
    />
  );
};
