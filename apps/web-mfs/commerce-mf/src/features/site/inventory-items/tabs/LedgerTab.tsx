import { useQueryClient } from '@tanstack/react-query';
import { Badge } from '@vritti/quantum-ui/Badge';
import { type ColumnDef, DataTable, DateTimeCell, NumberCell, useDataTable } from '@vritti/quantum-ui/DataTable';
import { useFormatters } from '@vritti/quantum-ui/hooks';
import { ScrollText } from 'lucide-react';
import type React from 'react';
import { useMemo } from 'react';
import type { InventoryItemLedgerData, InventoryItemLedgerType } from '@/schemas/inventory-items';
import { INVENTORY_ITEM_LEDGER_KEY, useInventoryItemLedgerTable } from '@/hooks/site/inventory-items';

interface LedgerTabProps {
  inventoryItemId: string;
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

export const LedgerTab: React.FC<LedgerTabProps> = ({ inventoryItemId, uomSymbol }) => {
  const queryClient = useQueryClient();
  const fmt = useFormatters();
  const { data: response, isLoading } = useInventoryItemLedgerTable(inventoryItemId);

  const columns = useMemo<ColumnDef<InventoryItemLedgerData>[]>(
    () => [
      {
        accessorKey: 'createdAt',
        header: 'Date',
        cell: ({ row }) => <DateTimeCell value={row.original.createdAt} className="font-mono" />,
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
              {fmt.number(q).primary} {uomSymbol}
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
            <NumberCell value={row.original.balanceAfter} /> {uomSymbol}
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
    [uomSymbol, fmt],
  );

  const { table } = useDataTable({
    columns,
    serverState: response,
    slug: `inventory-item-${inventoryItemId}-ledger`,
    label: 'entry',
    enableRowSelection: false,
    enableSorting: true,
    onStatePush: () => queryClient.invalidateQueries({ queryKey: [...INVENTORY_ITEM_LEDGER_KEY(inventoryItemId)] }),
  });

  return (
    <DataTable
      table={table}
      mode="tab"
      isLoading={isLoading}
      emptyStateConfig={{
        icon: ScrollText,
        title: 'No ledger entries',
        description: 'Movements appear here as goods are received, adjusted, transferred, or consumed.',
      }}
    />
  );
};
