import { Typography } from '@vritti/quantum-ui/Typography';
import type React from 'react';

export interface StatStripItem {
  label: React.ReactNode;
  value: React.ReactNode;
}

interface StatStripProps {
  stats: StatStripItem[];
  className?: string;
}

// Horizontal label/value summary strip — typically used under a PageHeader
export const StatStrip: React.FC<StatStripProps> = ({ stats, className }) => (
  <div className={['flex flex-wrap items-center gap-x-6 gap-y-2', className].filter(Boolean).join(' ')}>
    {stats.map((stat, index) => (
      // biome-ignore lint/suspicious/noArrayIndexKey: static, non-reordering summary strip
      <Typography key={index} variant="body2" intent="muted">
        <span className="font-medium text-foreground">{stat.value}</span> {stat.label}
      </Typography>
    ))}
  </div>
);
