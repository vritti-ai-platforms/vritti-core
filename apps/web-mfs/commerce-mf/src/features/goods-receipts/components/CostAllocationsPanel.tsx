import { useFormatters } from '@vritti/quantum-ui/hooks';
import { Skeleton } from '@vritti/quantum-ui/Skeleton';
import { useCostAllocations } from '@/hooks/goods-receipts';

interface CostAllocationsPanelProps {
  goodsReceiptId: string;
  costId: string;
}

export const CostAllocationsPanel = ({ goodsReceiptId, costId }: CostAllocationsPanelProps) => {
  const { data, isLoading } = useCostAllocations(goodsReceiptId, costId);
  const fmt = useFormatters();

  if (isLoading) return <Skeleton className="h-20 w-full" />;
  if (!data || data.length === 0) return <p className="text-sm text-muted-foreground p-3">No allocations.</p>;

  return (
    <div className="px-3 py-2">
      <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-2">Per-quant allocation</div>
      <div className="overflow-x-auto rounded-md border">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-muted-foreground">
            <tr>
              <th className="px-3 py-2 text-left font-medium">Location</th>
              <th className="px-3 py-2 text-left font-medium">Lot</th>
              <th className="px-3 py-2 text-right font-medium">Quantity</th>
              <th className="px-3 py-2 text-right font-medium">Allocated</th>
            </tr>
          </thead>
          <tbody>
            {data.map((r) => (
              <tr key={r.quantId} className="border-t">
                <td className="px-3 py-2">{r.locationName ?? '—'}</td>
                <td className="px-3 py-2">{r.lotNumber ?? '—'}</td>
                <td className="px-3 py-2 text-right font-mono">{r.quantity.toLocaleString()}</td>
                <td className="px-3 py-2 text-right font-mono">{fmt.currency(r.allocatedAmount).primary}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
