import { useFormatters } from '@vritti/quantum-ui/hooks';
import { LineChart } from '@vritti/quantum-ui/LineChart';
import type React from 'react';
import { type PricePoint, priceDomain } from '@/utils/supplierPrice';

interface PriceStepChartProps {
  points: PricePoint[];
  currencyCode: string;
  className?: string;
}

const CHART_CONFIG = { unitPrice: { label: 'Unit price', color: 'var(--chart-1)' } };

// One price series as a step line over a time axis — a price holds until the next one takes effect
export const PriceStepChart: React.FC<PriceStepChartProps> = ({ points, currencyCode, className }) => {
  const fmt = useFormatters();
  return (
    <LineChart
      data={points as unknown as Record<string, unknown>[]}
      config={CHART_CONFIG}
      xAxisKey="at"
      xAxisType="time"
      lines={[{ dataKey: 'unitPrice', type: 'stepAfter', dot: true }]}
      showLegend={false}
      yDomain={priceDomain(points.map((point) => point.unitPrice))}
      className={className}
      valueFormatter={(value) => String(fmt.currency({ currency: currencyCode, value: String(value) }).primary)}
      xAxisFormatter={(value) => String(fmt.date(new Date(Number(value)).toISOString().slice(0, 10)).primary)}
    />
  );
};
