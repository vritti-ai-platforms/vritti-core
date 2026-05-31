import { useQueryClient } from '@tanstack/react-query';
import { type ColumnDef, CurrencyCell, DataTable, StringCell, useDataTable } from '@vritti/quantum-ui/DataTable';
import { useFormatters } from '@vritti/quantum-ui/hooks';
import { Coins } from 'lucide-react';
import { useMemo } from 'react';
import {
  GOODS_RECEIPT_ITEMS_TABLE_KEY,
  useGoodsReceiptItemsCost,
  useGoodsReceiptItemsTable,
} from '@/hooks/goods-receipts';
import type { GoodsReceiptItemData } from '@/schemas/goods-receipts';

interface ItemsCostTabProps {
  goodsReceiptId: string;
}

export const ItemsCostTab = ({ goodsReceiptId }: ItemsCostTabProps) => {
  const queryClient = useQueryClient();
  const { data: response, isLoading } = useGoodsReceiptItemsTable(goodsReceiptId);
  const { data: cost } = useGoodsReceiptItemsCost(goodsReceiptId);
  const fmt = useFormatters();

  const columns = useMemo<ColumnDef<GoodsReceiptItemData>[]>(
    () => [
      {
        accessorKey: 'inventoryItemName',
        header: 'Item',
        cell: ({ row }) => <StringCell value={row.original.inventoryItemName} />,
        enableSorting: true,
      },
      {
        accessorKey: 'quantity',
        header: 'Quantity',
        cell: ({ row }) => (
          <span className="font-mono">
            {fmt.number(row.original.quantity).primary} {row.original.inventoryItemUomSymbol}
          </span>
        ),
        enableSorting: true,
      },
      {
        accessorKey: 'unitPrice',
        header: 'Unit Price',
        cell: ({ row }) => (row.original.unitPrice ? <CurrencyCell value={row.original.unitPrice} /> : '—'),
      },
      {
        accessorKey: 'lineTotal',
        header: 'Total',
        cell: ({ row }) => (row.original.lineTotal ? <CurrencyCell value={row.original.lineTotal} /> : '—'),
      },
    ],
    [fmt],
  );

  const { table } = useDataTable({
    columns,
    serverState: response,
    slug: `goods-receipt-${goodsReceiptId}-items`,
    label: 'item',
    enableRowSelection: false,
    enableSorting: true,
    onStatePush: () => queryClient.invalidateQueries({ queryKey: GOODS_RECEIPT_ITEMS_TABLE_KEY(goodsReceiptId) }),
  });

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between rounded-md border bg-card p-4">
        <div className="text-sm text-muted-foreground">Grand Total</div>
        <div className="text-2xl font-semibold font-mono">
          {cost?.grandTotal ? fmt.currency(cost.grandTotal).primary : '—'}
        </div>
      </div>

      <DataTable
        table={table}
        mode="tab"
        isLoading={isLoading}
        emptyStateConfig={{
          icon: Coins,
          title: 'No items',
          description: 'Add items to this receipt to see their cost.',
        }}
      />
    </div>
  );
};
