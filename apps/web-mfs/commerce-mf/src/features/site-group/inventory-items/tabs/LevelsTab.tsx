import { NumberCell } from '@vritti/quantum-ui/DataTable';
import { Skeleton } from '@vritti/quantum-ui/Skeleton';
import type React from 'react';
import { useSiteGroupItemLevels } from '@/hooks/site-group/inventory-items';
import { shortSiteId } from '../shortSiteId';

interface LevelsTabProps {
  siteIds: string[];
}

export const LevelsTab: React.FC<LevelsTabProps> = ({ siteIds }) => {
  const { data, isLoading } = useSiteGroupItemLevels(siteIds);

  if (isLoading) return <Skeleton className="h-64 w-full" />;

  if (!data || data.length === 0) {
    return (
      <div className="flex h-40 items-center justify-center rounded-xl border bg-card text-sm text-muted-foreground">
        No stock levels available for the selected sites.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border bg-card">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-b">
            <th className="p-3 text-left font-medium text-muted-foreground">Item</th>
            <th className="p-3 text-left font-mono font-medium text-muted-foreground">Site</th>
            <th className="p-3 text-right font-medium text-muted-foreground">Reorder Point</th>
            <th className="p-3 text-right font-medium text-muted-foreground">Max Stock</th>
            <th className="p-3 text-right font-medium text-muted-foreground">Safety Stock</th>
          </tr>
        </thead>
        <tbody>
          {data.map((row) => (
            <tr key={`${row.inventoryItemId}-${row.siteId}`} className="border-b last:border-b-0">
              <td className="p-3">
                <div className="font-medium">{row.itemName}</div>
                <div className="font-mono text-xs text-muted-foreground">{row.itemCode}</div>
              </td>
              <td className="p-3 font-mono text-xs text-muted-foreground">{shortSiteId(row.siteId)}</td>
              <td className="p-3 text-right">
                <NumberCell value={row.reorderPoint} />
              </td>
              <td className="p-3 text-right">
                <NumberCell value={row.maxStockLevel} />
              </td>
              <td className="p-3 text-right">
                <NumberCell value={row.safetyStock} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
