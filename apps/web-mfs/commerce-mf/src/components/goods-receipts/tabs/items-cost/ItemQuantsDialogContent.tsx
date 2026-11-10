import {
  type ColumnDef,
  CurrencyCell,
  DataTable,
  NumberCell,
  StringCell,
  useDataTable,
} from '@vritti/quantum-ui/DataTable';
import { DetailField } from '@vritti/quantum-ui/DetailField';
import { Boxes } from 'lucide-react';
import type React from 'react';
import { useMemo } from 'react';
import type { GoodsReceiptItemQuantRow } from '@/schemas/goods-receipts';
import type { GoodsReceiptsBinding } from '../../bindings';

interface ItemQuantsDialogContentProps {
  binding: GoodsReceiptsBinding;
  goodsReceiptId: string;
  itemId: string;
}

const columns: ColumnDef<GoodsReceiptItemQuantRow>[] = [
  {
    accessorKey: 'locationName',
    header: 'Location',
    cell: ({ row }) => <StringCell value={row.original.locationName} />,
  },
  { accessorKey: 'lotNumber', header: 'Lot', cell: ({ row }) => <StringCell value={row.original.lotNumber} mono /> },
  { accessorKey: 'quantity', header: 'Quantity', cell: ({ row }) => <NumberCell value={row.original.quantity} /> },
  { accessorKey: 'unitCost', header: 'Unit Cost', cell: ({ row }) => <CurrencyCell value={row.original.unitCost} /> },
  {
    accessorKey: 'totalCost',
    header: 'Total Cost',
    cell: ({ row }) => <CurrencyCell value={row.original.totalCost} />,
  },
  {
    accessorKey: 'quantCost',
    header: 'Quant Cost',
    cell: ({ row }) => <CurrencyCell value={row.original.quantCost} />,
  },
  {
    accessorKey: 'quantValue',
    header: 'Quant Value',
    cell: ({ row }) => <CurrencyCell value={row.original.quantValue} />,
  },
];

// The stock batches a published item created, with their landed cost and the grand total
export const ItemQuantsDialogContent: React.FC<ItemQuantsDialogContentProps> = ({
  binding,
  goodsReceiptId,
  itemId,
}) => {
  const { data: quants, isLoading } = binding.useItemQuants(goodsReceiptId, itemId);
  const quantRows = useMemo(() => ({ result: quants?.rows ?? [], count: quants?.rows.length ?? 0 }), [quants]);

  const quantsTable = useDataTable({
    columns,
    query: { data: quantRows, isLoading },
    slug: `goods-receipt-${goodsReceiptId}-item-${itemId}-quants`,
    label: 'stock batch',
    enableRowSelection: false,
  });

  return (
    <div className="flex flex-col gap-4">
      <DataTable
        table={quantsTable}
        mode="compact"
        emptyStateConfig={{
          icon: Boxes,
          title: 'No stock batches',
          description: 'This item has no resolved quants yet.',
        }}
      />
      <DetailField label="Grand Total" type="currency" value={quants?.grandTotal} />
    </div>
  );
};
