import { Badge } from '@vritti/quantum-ui/Badge';
import type React from 'react';
import { type StockStatus, stockStatusConfig } from '@/schemas/inventory-items';

interface StockStatusBadgeProps {
  status: StockStatus | null;
}

// Where the site's on-hand quantity sits against its stock levels; "Not at Site" while the site does not carry the item
export const StockStatusBadge: React.FC<StockStatusBadgeProps> = ({ status }) => {
  if (!status) return <Badge variant="outline">Not at Site</Badge>;
  const config = stockStatusConfig[status];
  return (
    <Badge variant={config.variant} title={config.tip}>
      {config.label}
    </Badge>
  );
};
