import { CompactTableSkeleton } from '@vritti/quantum-ui/DataTable';
import { Empty } from '@vritti/quantum-ui/Empty';
import { useFormatters } from '@vritti/quantum-ui/hooks';
import { Boxes } from 'lucide-react';
import { useGoodsReceiptItemQuants } from '@/site/hooks/goods-receipts';

interface ItemQuantsDialogContentProps {
  goodsReceiptId: string;
  itemId: string;
}

export const ItemQuantsDialogContent = ({ goodsReceiptId, itemId }: ItemQuantsDialogContentProps) => {
  const { data, isLoading } = useGoodsReceiptItemQuants(goodsReceiptId, itemId);
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
          { headerWidth: 'w-20', cellWidth: 'w-24' },
        ]}
      />
    );
  }

  const rows = data?.rows ?? [];

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
            <th className="px-3 py-2.5 text-left font-medium">Location</th>
            <th className="px-3 py-2.5 text-left font-medium">Lot</th>
            <th className="px-3 py-2.5 text-right font-medium">Quantity</th>
            <th className="px-3 py-2.5 text-right font-medium">Unit Cost</th>
            <th className="px-3 py-2.5 text-right font-medium">Total Cost</th>
            <th className="px-3 py-2.5 text-right font-medium">Quant Cost</th>
            <th className="px-3 py-2.5 text-right font-medium">Quant Value</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.quantId} className="border-b last:border-b-0">
              <td className="px-3 py-2.5">{row.locationName ?? '—'}</td>
              <td className="px-3 py-2.5">{row.lotNumber ?? '—'}</td>
              <td className="px-3 py-2.5 text-right font-mono">{fmt.number(row.quantity).primary}</td>
              <td className="px-3 py-2.5 text-right font-mono">
                {row.unitCost ? fmt.currency(row.unitCost).primary : '—'}
              </td>
              <td className="px-3 py-2.5 text-right font-mono">
                {row.totalCost ? fmt.currency(row.totalCost).primary : '—'}
              </td>
              <td className="px-3 py-2.5 text-right font-mono">
                {row.quantCost ? fmt.currency(row.quantCost).primary : '—'}
              </td>
              <td className="px-3 py-2.5 text-right font-mono">
                {row.quantValue ? fmt.currency(row.quantValue).primary : '—'}
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="border-t bg-muted/40 font-semibold">
            <td className="px-3 py-2.5" colSpan={6}>
              Grand Total
            </td>
            <td className="px-3 py-2.5 text-right font-mono">
              {data?.grandTotal ? fmt.currency(data.grandTotal).primary : '—'}
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
};
