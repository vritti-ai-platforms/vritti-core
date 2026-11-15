import { useFormatters } from '@vritti/quantum-ui/hooks';
import { Typography } from '@vritti/quantum-ui/Typography';
import type React from 'react';
import type { SiteStockData } from '@/schemas/inventory-items';
import { StockLevelBar } from './StockLevelBar';
import { StockStatusBadge } from './StockStatusBadge';

interface StockLevelsCellProps {
  stock: SiteStockData;
  uomSymbol: string | null;
}

// An item's stock at one site in one cell: its status, the quantity on hand and what it is worth, and the stock level
// bar split by location, an empty track until its levels are set
export const StockLevelsCell: React.FC<StockLevelsCellProps> = ({ stock, uomSymbol }) => {
  const fmt = useFormatters();
  return (
    <div className="flex min-w-72 flex-col gap-2 py-1">
      <div className="flex items-center justify-between gap-3">
        <StockStatusBadge status={stock.stockStatus} />
        <Typography variant="body2" className="flex items-baseline gap-1.5 whitespace-nowrap">
          <span className="font-mono font-medium">{fmt.number(stock.onHand).primary}</span>
          {uomSymbol && <span className="text-xs text-muted-foreground">{uomSymbol}</span>}
          <span aria-hidden className="text-border">
            |
          </span>
          <span className="font-mono text-muted-foreground">{fmt.currency(stock.stockValue).primary}</span>
        </Typography>
      </div>
      <StockLevelBar
        onHand={stock.onHand}
        safetyStock={stock.safetyStock ?? 0}
        reorderPoint={stock.reorderPoint ?? 0}
        maxStockLevel={stock.maxStockLevel ?? 0}
        status={stock.stockStatus ?? undefined}
        uomSymbol={uomSymbol}
        locations={stock.locations}
      />
    </div>
  );
};
