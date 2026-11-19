import { useFormatters } from '@vritti/quantum-ui/hooks';
import { Typography } from '@vritti/quantum-ui/Typography';
import type React from 'react';
import type { SiteStockData } from '@/schemas/inventory-items';
import { StockStatusBadge } from './StockStatusBadge';
import { StockLevelBar } from './stock-level-bar/StockLevelBar';

interface SiteStockCellProps {
  stock: SiteStockData;
  uomSymbol: string;
}

// An item's stock at one site in one cell: its status, the quantity on hand in the item's display unit and what it is
// worth, and the stock level bar split by location; an empty track while the site does not carry it
export const SiteStockCell: React.FC<SiteStockCellProps> = ({ stock, uomSymbol }) => {
  const fmt = useFormatters();
  return (
    <div className="flex min-w-72 flex-col gap-2 py-1">
      <div className="flex items-center justify-between gap-3">
        <StockStatusBadge status={stock.stockStatus} />
        <Typography variant="body2" className="flex items-baseline gap-1.5 whitespace-nowrap">
          <span className="font-mono font-medium">{fmt.quantity(stock.display.onHand).primary}</span>
          <span aria-hidden className="text-border">
            |
          </span>
          <span className="font-mono text-muted-foreground">{fmt.currency(stock.stockValue).primary}</span>
        </Typography>
      </div>
      <StockLevelBar
        onHand={stock.onHand}
        replenishment={stock.replenishment}
        safetyStock={stock.safetyStock}
        reorderPoint={stock.reorderPoint}
        maxStock={stock.maxStock}
        status={stock.stockStatus ?? undefined}
        uomSymbol={uomSymbol}
        locations={stock.locations}
        display={stock.display}
      />
    </div>
  );
};
