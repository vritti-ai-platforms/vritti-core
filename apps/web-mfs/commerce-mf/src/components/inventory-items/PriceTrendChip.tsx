import { Badge } from '@vritti/quantum-ui/Badge';
import { useFormatters } from '@vritti/quantum-ui/hooks';
import { Minus, TrendingDown, TrendingUp } from 'lucide-react';
import type React from 'react';
import type { PriceTrend } from '@/utils/supplierPrice';

const TREND_ICONS = { up: TrendingUp, down: TrendingDown, flat: Minus } as const;

// The move of the price in force against the one it replaced — arrow and words carry the direction, never colour
export const PriceTrendChip: React.FC<{ trend: PriceTrend; since?: string }> = ({ trend, since }) => {
  const fmt = useFormatters();
  const Icon = TREND_ICONS[trend.direction];
  return (
    <Badge variant="outline" className="gap-1 font-normal">
      <Icon className="size-3" aria-hidden />
      <span className="tabular-nums">
        {trend.direction === 'flat'
          ? 'Unchanged'
          : `${trend.direction === 'up' ? 'Up' : 'Down'} ${fmt.number(trend.percent, { fractionDigits: 1 }).primary}%`}
      </span>
      {since && <span className="text-muted-foreground">since {fmt.date(since).primary}</span>}
    </Badge>
  );
};
