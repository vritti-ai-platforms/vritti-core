import { useMemo, useState } from 'react';
import { type PriceTimeline, priceCurrencies } from '@/utils/supplierPrice';

// The currency a price chart shows: the one picked while it is still among the data's, else the one in force first
export function usePriceCurrency(timelines: PriceTimeline[]) {
  const currencies = useMemo(() => priceCurrencies(timelines), [timelines]);
  const [picked, setPicked] = useState<string>();
  const currency = picked && currencies.includes(picked) ? picked : currencies[0];
  return { currencies, currency, setCurrency: setPicked };
}
