import { Badge } from '@vritti/quantum-ui/Badge';
import { Skeleton } from '@vritti/quantum-ui/Skeleton';
import { CheckCircle2 } from 'lucide-react';
import type React from 'react';
import { useMemo } from 'react';
import { useSiteGroupInventoryItemsMatrix } from '@/hooks/site-group/inventory-items';
import { shortSiteId } from '../shortSiteId';

interface AvailabilityTabProps {
  siteIds: string[];
}

export const AvailabilityTab: React.FC<AvailabilityTabProps> = ({ siteIds }) => {
  const { data, isLoading } = useSiteGroupInventoryItemsMatrix(siteIds);

  // Distinct site columns derived from the union of siteId across matrix rows
  const columns = useMemo(() => {
    const set = new Set<string>();
    for (const row of data ?? []) set.add(row.siteId);
    return Array.from(set).sort();
  }, [data]);

  // Group rows per item and mark availability by (itemId, siteId)
  const items = useMemo(() => {
    const map = new Map<string, { itemName: string; itemCode: string; available: Set<string> }>();
    for (const row of data ?? []) {
      let entry = map.get(row.inventoryItemId);
      if (!entry) {
        entry = { itemName: row.itemName, itemCode: row.itemCode, available: new Set<string>() };
        map.set(row.inventoryItemId, entry);
      }
      if (row.isStocked) entry.available.add(row.siteId);
    }
    return Array.from(map.entries()).map(([inventoryItemId, entry]) => ({ inventoryItemId, ...entry }));
  }, [data]);

  if (isLoading) return <Skeleton className="h-64 w-full" />;

  if (items.length === 0) {
    return (
      <div className="flex h-40 items-center justify-center rounded-xl border bg-card text-sm text-muted-foreground">
        No inventory items available for the selected sites.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border bg-card">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-b">
            <th className="p-3 text-left font-medium text-muted-foreground">Item</th>
            {columns.map((siteId) => (
              <th key={siteId} className="p-3 text-center font-mono font-medium text-muted-foreground">
                {shortSiteId(siteId)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item.inventoryItemId} className="border-b last:border-b-0">
              <td className="p-3">
                <div className="font-medium">{item.itemName}</div>
                <div className="font-mono text-xs text-muted-foreground">{item.itemCode}</div>
              </td>
              {columns.map((siteId) => (
                <td key={siteId} className="p-3 text-center">
                  {item.available.has(siteId) ? (
                    <Badge variant="success">
                      <CheckCircle2 className="size-3.5" />
                    </Badge>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
