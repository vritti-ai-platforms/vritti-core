import type React from 'react';
import type { SitePriceHistory } from '@/schemas/suppliers';
import type { PriceRange } from '@/utils/supplierPrice';
import { PriceSeriesChart } from './PriceSeriesChart';

export type SitePrices = SitePriceHistory & { siteName: string };

interface SitePricesChartProps {
  sites: SitePrices[];
  currencyCode: string;
  range: PriceRange;
}

// Every given site's price for one supplier item, a line per site
export const SitePricesChart: React.FC<SitePricesChartProps> = ({ sites, currencyCode, range }) => (
  <PriceSeriesChart
    series={sites.map((site) => ({ ...site, id: site.siteId, label: site.siteName }))}
    currencyCode={currencyCode}
    noun="site"
    range={range}
  />
);
