import { useQueryClient } from '@tanstack/react-query';
import {
  type ColumnDef,
  CurrencyCell,
  DataTable,
  type RowAction,
  RowActions,
  StringCell,
  useDataTable,
} from '@vritti/quantum-ui/DataTable';
import { useFormatters } from '@vritti/quantum-ui/hooks';
import { Coins, Eye } from 'lucide-react';
import { useMemo } from 'react';
import type { GoodsReceiptItemData } from '@/schemas/goods-receipts';
import { ItemQuantsDialogContent } from '@/site/features/goods-receipts/components/ItemQuantsDialogContent';
import { GOODS_RECEIPT_ITEMS_TABLE_KEY, useGoodsReceiptItemsTable } from '@/site/hooks/goods-receipts';

interface ItemsCostTabProps {
  goodsReceiptId: string;
  isDraft: boolean;
}

export const ItemsCostTab = ({ goodsReceiptId, isDraft }: ItemsCostTabProps) => {
  const queryClient = useQueryClient();
  const { data: response, isLoading } = useGoodsReceiptItemsTable(goodsReceiptId);
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
        accessorKey: 'orderedQty',
        header: 'Ordered',
        cell: ({ row }) => (
          <span className="font-mono">
            {fmt.number(row.original.orderedQty).primary} {row.original.inventoryItemUomSymbol}
          </span>
        ),
        enableSorting: true,
      },
      {
        accessorKey: 'freeQty',
        header: 'Free',
        cell: ({ row }) => (
          <span className="font-mono">
            {fmt.number(row.original.freeQty).primary} {row.original.inventoryItemUomSymbol}
          </span>
        ),
      },
      {
        accessorKey: 'totalQty',
        header: 'Total',
        cell: ({ row }) => (
          <span className="font-mono">
            {fmt.number(row.original.totalQty).primary} {row.original.inventoryItemUomSymbol}
          </span>
        ),
      },
      {
        accessorKey: 'unitPrice',
        header: 'Unit Price',
        cell: ({ row }) => (row.original.unitPrice ? <CurrencyCell value={row.original.unitPrice} /> : '—'),
      },
      {
        accessorKey: 'unitCost',
        header: 'Unit Cost',
        cell: ({ row }) => (row.original.unitCost ? <CurrencyCell value={row.original.unitCost} /> : '—'),
      },
      {
        accessorKey: 'lineTotal',
        header: 'Total',
        cell: ({ row }) => (row.original.lineTotal ? <CurrencyCell value={row.original.lineTotal} /> : '—'),
      },
      // Quants exist only after publish, so the cost breakdown is published-only.
      ...(isDraft
        ? []
        : [
            {
              id: 'actions',
              header: '',
              cell: ({ row }) => {
                const actions: RowAction[] = [
                  {
                    id: 'view-quants',
                    icon: Eye,
                    label: 'View',
                    dialog: {
                      title: row.original.inventoryItemName,
                      description: 'Stock batches created from this item and their landed cost.',
                      className: 'max-w-3xl',
                      content: () => (
                        <ItemQuantsDialogContent goodsReceiptId={goodsReceiptId} itemId={row.original.id} />
                      ),
                    },
                  },
                ];
                return <RowActions actions={actions} />;
              },
              enableSorting: false,
              enableHiding: false,
            } satisfies ColumnDef<GoodsReceiptItemData>,
          ]),
    ],
    [fmt, isDraft, goodsReceiptId],
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
  );
};
