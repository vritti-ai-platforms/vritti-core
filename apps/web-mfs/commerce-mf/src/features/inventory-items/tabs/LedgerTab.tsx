import { useQueryClient } from '@tanstack/react-query';
import { Badge } from '@vritti/quantum-ui/Badge';
import { type ColumnDef, DataTable, useDataTable } from '@vritti/quantum-ui/DataTable';
import { FormattedDate } from '@vritti/quantum-ui/FormattedDate';
import { ScrollText } from 'lucide-react';
import type React from 'react';
import { useMemo } from 'react';
import { INVENTORY_ITEM_LEDGER_KEY, useInventoryItemLedgerTable } from '@/hooks/inventory-items';
import type { InventoryItemLedgerData, InventoryItemLedgerType } from '@/schemas/inventory-items';

interface LedgerTabProps {
  itemId: string;
  uomSymbol: string | null;
}

const TYPE_CONFIG: Record<
  InventoryItemLedgerType,
  { label: string; variant: 'default' | 'secondary' | 'outline' | 'destructive' | 'ghost' }
> = {
  GOODS_RECEIPT: { label: 'Goods Receipt', variant: 'default' },
  OPENING_STOCK: { label: 'Opening Stock', variant: 'default' },
  ORDER_RESERVE: { label: 'Order Reserve', variant: 'secondary' },
  ORDER_DEDUCT: { label: 'Order Deduct', variant: 'destructive' },
  ORDER_CANCEL: { label: 'Order Cancel', variant: 'outline' },
  ADJUSTMENT: { label: 'Adjustment', variant: 'secondary' },
  CONVERSION_INPUT: { label: 'Conversion In', variant: 'default' },
  CONVERSION_OUTPUT: { label: 'Conversion Out', variant: 'destructive' },
  TRANSFER_OUT: { label: 'Transfer Out', variant: 'destructive' },
  TRANSFER_IN: { label: 'Transfer In', variant: 'default' },
};

export const LedgerTab: React.FC<LedgerTabProps> = ({ itemId, uomSymbol }) => {
  const queryClient = useQueryClient();
  const { data: response, isLoading } = useInventoryItemLedgerTable(itemId);

  const columns = useMemo<ColumnDef<InventoryItemLedgerData>[]>(
    () => [
      {
        accessorKey: 'createdAt',
        header: 'Date',
        cell: ({ row }) => <FormattedDate value={row.original.createdAt} dateFormat="Pp" className="font-mono" />,
        enableSorting: true,
      },
      {
        accessorKey: 'type',
        header: 'Type',
        cell: ({ row }) => {
          const config = TYPE_CONFIG[row.original.type];
          return <Badge variant={config.variant}>{config.label}</Badge>;
        },
      },
      {
        accessorKey: 'quantity',
        header: 'Quantity',
        cell: ({ row }) => {
          const q = row.original.quantity;
          return (
            <span className={`font-mono ${q > 0 ? 'text-success' : q < 0 ? 'text-destructive' : ''}`}>
              {q > 0 ? '+' : ''}
              {q} {uomSymbol}
            </span>
          );
        },
        enableSorting: true,
      },
      {
        accessorKey: 'balanceAfter',
        header: 'Balance',
        cell: ({ row }) => (
          <span className="font-mono">
            {row.original.balanceAfter} {uomSymbol}
          </span>
        ),
      },
      {
        id: 'reference',
        header: 'Reference',
        cell: ({ row }) => {
          const referenceId = row.original.referenceId;
          return (
            <div>
              <span className="text-muted-foreground text-xs">{row.original.referenceType ?? '—'}</span>
              {referenceId && <div className="font-mono text-xs truncate max-w-32">{referenceId}</div>}
            </div>
          );
        },
      },
      {
        accessorKey: 'notes',
        header: 'Notes',
        cell: ({ row }) => <span className="text-muted-foreground text-sm">{row.original.notes ?? '—'}</span>,
      },
    ],
    [uomSymbol],
  );

  const { table } = useDataTable({
    columns,
    serverState: response,
    slug: `inventory-item-${itemId}-ledger`,
    label: 'entry',
    enableRowSelection: false,
    enableSorting: true,
    onStatePush: () => queryClient.invalidateQueries({ queryKey: [...INVENTORY_ITEM_LEDGER_KEY(itemId)] }),
  });

  return (
    <DataTable
      table={table}
      mode="compact"
      isLoading={isLoading}
      emptyStateConfig={{
        icon: ScrollText,
        title: 'No ledger entries',
        description: 'Movements appear here as goods are received, adjusted, transferred, or consumed.',
      }}
    />
  );
};
