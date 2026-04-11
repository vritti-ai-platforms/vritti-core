import { useQueryClient } from '@tanstack/react-query';
import { Badge } from '@vritti/quantum-ui/Badge';
import { type ColumnDef, DataTable, useDataTable } from '@vritti/quantum-ui/DataTable';
import { ScrollText } from 'lucide-react';
import type React from 'react';
import { useMemo } from 'react';
import { INVENTORY_ITEM_BATCH_LEDGER_KEY, useInventoryItemBatchLedgerTable } from '@/hooks/inventory-item-batches';
import type { BatchLedgerData } from '@/schemas/inventory-item-batches';

interface BatchLedgerTabProps {
  batchId: string;
  uomSymbol?: string | null;
}

const TYPE_LABELS: Record<string, string> = {
  GOODS_RECEIPT: 'Goods Receipt',
  ORDER_RESERVE: 'Order Reserve',
  ORDER_DEDUCT: 'Order Deduct',
  ORDER_CANCEL: 'Order Cancel',
  ADJUSTMENT: 'Adjustment',
  CONVERSION_INPUT: 'Conversion Input',
  CONVERSION_OUTPUT: 'Conversion Output',
  TRANSFER_OUT: 'Transfer Out',
  TRANSFER_IN: 'Transfer In',
};

export const BatchLedgerTab: React.FC<BatchLedgerTabProps> = ({ batchId, uomSymbol }) => {
  const queryClient = useQueryClient();
  const { data: response, isLoading } = useInventoryItemBatchLedgerTable(batchId);

  const columns = useMemo<ColumnDef<BatchLedgerData>[]>(
    () => [
      {
        accessorKey: 'createdAt',
        header: 'Date',
        cell: ({ row }) => (
          <span className="text-muted-foreground">{new Date(row.original.createdAt).toLocaleDateString()}</span>
        ),
        enableSorting: true,
      },
      {
        accessorKey: 'type',
        header: 'Type',
        cell: ({ row }) => <Badge variant="outline">{TYPE_LABELS[row.original.type] ?? row.original.type}</Badge>,
      },
      {
        accessorKey: 'quantity',
        header: 'Quantity',
        cell: ({ row }) => {
          const isPositive = row.original.quantity > 0;
          return (
            <span className={`font-mono ${isPositive ? 'text-success' : 'text-destructive'}`}>
              {isPositive ? '+' : ''}
              {row.original.quantity} {uomSymbol}
            </span>
          );
        },
      },
      {
        accessorKey: 'referenceType',
        header: 'Reference',
        cell: ({ row }) => <span className="text-muted-foreground">{row.original.referenceType ?? '—'}</span>,
      },
      {
        accessorKey: 'notes',
        header: 'Notes',
        cell: ({ row }) => <span className="text-muted-foreground">{row.original.notes ?? '—'}</span>,
      },
    ],
    [uomSymbol],
  );

  const { table } = useDataTable({
    columns,
    serverState: response,
    slug: `inventory-batch-${batchId}-ledger`,
    label: 'entry',
    enableRowSelection: false,
    enableSorting: true,
    onStatePush: () => queryClient.invalidateQueries({ queryKey: [...INVENTORY_ITEM_BATCH_LEDGER_KEY(batchId)] }),
  });

  return (
    <DataTable
      table={table}
      mode="compact"
      isLoading={isLoading}
      emptyStateConfig={{
        icon: ScrollText,
        title: 'No ledger entries',
        description: 'Entries are created automatically when stock changes.',
      }}
    />
  );
};
