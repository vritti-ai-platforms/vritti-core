import { useChart } from '@vritti/quantum-ui/Chart';
import { cn } from '@vritti/quantum-ui/cn';
import { useCategoricalColors } from '@vritti/quantum-ui/hooks';
import { PieChart } from '@vritti/quantum-ui/PieChart';
import { useMemo } from 'react';
import type { PaymentTermRuleData } from '@/schemas/payment-terms';
import { remainingPercent } from './payment-schedule';

interface RuleSharePieProps {
  rules: PaymentTermRuleData[];
  totalPercent: number;
}

interface RuleSlice {
  key: string;
  label: string;
  share: number;
  color: string;
}

const selectSlices = (slices: RuleSlice[]) => ({
  rows: slices.map((slice) => ({ key: slice.key, share: slice.share })),
  series: slices.map((slice) => ({ id: slice.key, label: slice.label, color: slice.color })),
});

export const RuleSharePie = ({ rules, totalPercent }: RuleSharePieProps) => {
  const colors = useCategoricalColors(rules.length);
  const remaining = remainingPercent(totalPercent);

  const slices = useMemo<RuleSlice[]>(
    () => [
      ...rules.map((rule, index) => ({
        key: `rule-${rule.id}`,
        label: `Day ${rule.dueDays}`,
        share: rule.percent,
        color: colors[index].background,
      })),
      ...(remaining > 0
        ? [{ key: 'unallocated', label: 'Unallocated', share: remaining, color: 'var(--color-muted-foreground)' }]
        : []),
    ],
    [rules, colors, remaining],
  );
  const chart = useChart({ data: slices, select: selectSlices });

  return (
    <div className="flex items-center gap-3">
      <PieChart
        chart={chart}
        mode="compact"
        className="size-14 border-0 p-0"
        dataKey="share"
        nameKey="key"
        innerRadius="55%"
        hideLegend
      />
      <div className="flex flex-col text-sm">
        <span className={cn('font-semibold', remaining === 0 ? 'text-success' : 'text-warning')}>
          {totalPercent}% allocated
        </span>
        {remaining > 0 && <span className="text-muted-foreground text-xs">{remaining}% left</span>}
      </div>
    </div>
  );
};
