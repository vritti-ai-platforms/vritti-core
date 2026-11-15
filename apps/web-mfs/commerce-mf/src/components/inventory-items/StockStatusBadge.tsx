import { Badge } from '@vritti/quantum-ui/Badge';
import type React from 'react';
import { type StockStatus, stockStatusConfig } from '@/schemas/inventory-items';

interface StockStatusBadgeProps {
  status: StockStatus | null;
}

// Where the site's on-hand quantity sits against its stock levels; "No Stock Levels" before any are set
export const StockStatusBadge: React.FC<StockStatusBadgeProps> = ({ status }) => {
  if (!status) return <Badge variant="outline">No Stock Levels</Badge>;
  const config = stockStatusConfig[status];
  return (
    <Badge variant={config.variant} title={config.tip}>
      {config.label}
    </Badge>
  );
};
