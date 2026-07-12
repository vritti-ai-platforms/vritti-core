import { CompactTableSkeleton, DateCell } from '@vritti/quantum-ui/DataTable';
import { Empty } from '@vritti/quantum-ui/Empty';
import { useFormatters } from '@vritti/quantum-ui/hooks';
import { Boxes } from 'lucide-react';
import { useLocationItemQuants } from '@/site/hooks/locations';

interface LocationItemQuantsDialogContentProps {
  locationId: string;
  itemId: string;
}

export const LocationItemQuantsDialogContent = ({ locationId, itemId }: LocationItemQuantsDialogContentProps) => {
  const { data, isLoading } = useLocationItemQuants(locationId, itemId);
  const fmt = useFormatters();

  if (isLoading) {
    return (
      <CompactTableSkeleton
        rows={4}
        columns={[
          { headerWidth: 'w-28', cellWidth: 'w-36' },
          { headerWidth: 'w-20', cellWidth: 'w-24' },
          { headerWidth: 'w-16', cellWidth: 'w-16' },
          { headerWidth: 'w-20', cellWidth: 'w-24' },
          { headerWidth: 'w-20', cellWidth: 'w-24' },
          { headerWidth: 'w-20', cellWidth: 'w-24' },
        ]}
      />
    );
  }

  const rows = data ?? [];

  if (rows.length === 0) {
    return (
      <div className="flex items-center justify-center py-10">
        <Empty icon={<Boxes />} title="No stock batches" description="This item has no resolved quants yet." />
      </div>
    );
  }

  return (
    <div className="rounded-md border overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-muted/40">
          <tr className="border-b">
            <th className="px-3 py-2.5 text-left font-medium">Lot</th>
            <th className="px-3 py-2.5 text-left font-medium">Expiry</th>
            <th className="px-3 py-2.5 text-right font-medium">Quantity</th>
            <th className="px-3 py-2.5 text-right font-medium">Available</th>
            <th className="px-3 py-2.5 text-right font-medium">Unit Cost</th>
            <th className="px-3 py-2.5 text-right font-medium">Value</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.quantId} className="border-b last:border-b-0">
              <td className="px-3 py-2.5">{row.lotNumber ?? '—'}</td>
              <td className="px-3 py-2.5">
                <DateCell value={row.expiryDate} />
              </td>
              <td className="px-3 py-2.5 text-right font-mono">{fmt.number(row.quantity).primary}</td>
              <td className="px-3 py-2.5 text-right font-mono">{fmt.number(row.availableQuantity).primary}</td>
              <td className="px-3 py-2.5 text-right font-mono">
                {row.unitCost ? fmt.currency(row.unitCost).primary : '—'}
              </td>
              <td className="px-3 py-2.5 text-right font-mono">
                {row.quantValue ? fmt.currency(row.quantValue).primary : '—'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
