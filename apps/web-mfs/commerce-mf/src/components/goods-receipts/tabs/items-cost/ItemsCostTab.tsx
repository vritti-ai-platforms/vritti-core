import { Alert } from '@vritti/quantum-ui/Alert';
import {
  type ColumnDef,
  CurrencyCell,
  DataTable,
  NumberCell,
  RowActions,
  useDataTable,
} from '@vritti/quantum-ui/DataTable';
import { Coins, Eye } from 'lucide-react';
import type React from 'react';
import { useMemo } from 'react';
import type { GoodsReceiptItemCostRow } from '@/schemas/goods-receipts';
import type { GoodsReceiptsBinding } from '../../bindings';
import { ItemQuantsDialogContent } from './ItemQuantsDialogContent';

interface ItemsCostTabProps {
  binding: GoodsReceiptsBinding;
  goodsReceiptId: string;
  isDraft: boolean;
}

// The provisional cost of the accepted goods, read-only: the PO line's value spread over its ordered and expected free
// quantity, in the legal entity's currency; a published item opens the stock batches it created
export const ItemsCostTab: React.FC<ItemsCostTabProps> = ({ binding, goodsReceiptId, isDraft }) => {
  const { data: cost, isLoading } = binding.useItemsCost(goodsReceiptId);
  const costRows = useMemo(() => ({ result: cost?.rows ?? [], count: cost?.rows.length ?? 0 }), [cost]);

  const columns = useMemo<ColumnDef<GoodsReceiptItemCostRow>[]>(
    () => [
      { accessorKey: 'inventoryItemName', header: 'Item' },
      {
        accessorKey: 'acceptedQty',
        header: 'Accepted',
        cell: ({ row }) => (
          <span className="font-mono">
            <NumberCell value={row.original.acceptedQty} /> {row.original.uomSymbol}
          </span>
        ),
      },
      {
        accessorKey: 'acceptedPrimaryQty',
        header: 'Accepted (Primary Unit)',
        cell: ({ row }) => (
          <span className="font-mono">
            <NumberCell value={row.original.acceptedPrimaryQty} /> {row.original.primaryUomSymbol}
          </span>
        ),
      },
      {
        accessorKey: 'unitCost',
        header: 'Unit Cost',
        cell: ({ row }) => <CurrencyCell value={row.original.unitCost} />,
      },
      {
        accessorKey: 'value',
        header: 'Value',
        cell: ({ row }) => <CurrencyCell value={row.original.value} />,
      },
      ...(isDraft
        ? []
        : [
            {
              id: 'actions',
              header: '',
              cell: ({ row }) => (
                <RowActions
                  actions={[
                    {
                      id: 'view-quants',
                      icon: Eye,
                      label: 'View',
                      dialog: {
                        title: row.original.inventoryItemName,
                        description: 'Stock batches created from this item and their landed cost.',
                        className: 'max-w-3xl',
                        content: () => (
                          <ItemQuantsDialogContent
                            binding={binding}
                            goodsReceiptId={goodsReceiptId}
                            itemId={row.original.id}
                          />
                        ),
                      },
                    },
                  ]}
                />
              ),
              enableSorting: false,
              enableHiding: false,
            } satisfies ColumnDef<GoodsReceiptItemCostRow>,
          ]),
    ],
    [binding, goodsReceiptId, isDraft],
  );

  const itemsCostTable = useDataTable({
    columns,
    query: { data: costRows, isLoading },
    slug: `goods-receipt-${goodsReceiptId}-items-cost`,
    label: 'item',
    enableRowSelection: false,
  });

  return (
    <div className="flex flex-col gap-4">
      <Alert
        variant="info"
        title="Provisional cost"
        description="Valued from the purchase order line. Posting the supplier's invoice sets the final cost."
      />
      <DataTable
        table={itemsCostTable}
        mode="tab"
        permission={binding.permissions.view}
        emptyStateConfig={{
          icon: Coins,
          title: 'No items',
          description: 'Count items on this receipt to see their provisional cost.',
        }}
      />
    </div>
  );
};
