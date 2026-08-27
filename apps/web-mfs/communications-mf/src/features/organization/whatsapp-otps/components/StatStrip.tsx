import { Card } from '@vritti/quantum-ui/Card';
import { cn } from '@vritti/quantum-ui/cn';

export interface StatStripItem {
  label: string;
  value: number | string;
  emphasis?: 'default' | 'destructive';
}

interface StatStripProps {
  items: StatStripItem[];
}

export const StatStrip = ({ items }: StatStripProps) => (
  <Card className="flex flex-col divide-y divide-border sm:flex-row sm:divide-x sm:divide-y-0">
    {items.map((item) => (
      <div
        key={item.label}
        // Label and value share a line on narrow screens and stack once there is room for a row of four
        className="flex flex-1 items-baseline justify-between gap-3 px-4 py-3 sm:flex-col sm:justify-start sm:gap-0.5"
      >
        <span className="text-xs font-medium text-muted-foreground">{item.label}</span>
        <span
          className={cn(
            'text-lg font-semibold tabular-nums',
            item.emphasis === 'destructive' ? 'text-destructive' : 'text-foreground',
          )}
        >
          {item.value}
        </span>
      </div>
    ))}
  </Card>
);
