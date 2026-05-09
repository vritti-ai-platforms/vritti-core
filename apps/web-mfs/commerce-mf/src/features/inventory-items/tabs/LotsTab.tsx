import { useQueryClient } from '@tanstack/react-query';
import { Badge } from '@vritti/quantum-ui/Badge';
import { type ColumnDef, DataTable, RowActions, useDataTable } from '@vritti/quantum-ui/DataTable';
import { FormattedDate } from '@vritti/quantum-ui/FormattedDate';
import { Boxes, Eye } from 'lucide-react';
import type React from 'react';
import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { INVENTORY_ITEM_BATCHES_KEY, useInventoryItemBatchesTable } from '@/hooks/inventory-items';
import type { InventoryItemBatchData, InventoryItemBatchStatus } from '@/schemas/inventory-item-batches';

interface LotsTabProps {
  itemId: string;
  uomSymbol: string | null;
}

function getBatchStatus(expiryDate: string | null): InventoryItemBatchStatus {
  if (!expiryDate) return 'FRESH';
  const diffMs = new Date(expiryDate).getTime() - Date.now();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays < 0) return 'EXPIRED';
  if (diffDays <= 7) return 'EXPIRING_SOON';
  return 'FRESH';
}

const STATUS_CONFIG: Record<
  InventoryItemBatchStatus,
  { label: string; variant: 'default' | 'secondary' | 'outline' | 'destructive' | 'ghost' }
> = {
  EXPIRED: { label: 'Expired', variant: 'destructive' },
  EXPIRING_SOON: { label: 'Expiring Soon', variant: 'secondary' },
  FRESH: { label: 'Fresh', variant: 'default' },
};

export const LotsTab: React.FC<LotsTabProps> = ({ itemId, uomSymbol }) => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { data: response, isLoading } = useInventoryItemBatchesTable(itemId);

  const columns = useMemo<ColumnDef<InventoryItemBatchData>[]>(
    () => [
      {
        accessorKey: 'batchNumber',
        header: 'Lot #',
        cell: ({ row }) => <span className="font-mono">{row.original.batchNumber ?? '—'}</span>,
      },
      {
        accessorKey: 'locationName',
        header: 'Location',
        cell: ({ row }) => row.original.locationName ?? '—',
      },
      {
        accessorKey: 'locationPath',
        header: 'Path',
        cell: ({ row }) => (
          <span className="text-xs text-muted-foreground">{row.original.locationPath ?? '—'}</span>
        ),
        enableSorting: false,
      },
      {
        accessorKey: 'quantity',
        header: 'Qty',
        cell: ({ row }) => (
          <span className="font-mono">
            {row.original.quantity} {uomSymbol}
          </span>
        ),
      },
      {
        accessorKey: 'reservedQuantity',
        header: 'Reserved',
        cell: ({ row }) => <span className="font-mono">{row.original.reservedQuantity}</span>,
      },
      {
        accessorKey: 'availableQuantity',
        header: 'Available',
        cell: ({ row }) => (
          <span className="font-mono font-semibold">
            {row.original.availableQuantity} {uomSymbol}
          </span>
        ),
      },
      {
        accessorKey: 'expiryDate',
        header: 'Expiry Date',
        cell: ({ row }) => {
          const { expiryDate } = row.original;
          if (!expiryDate) return <span className="text-muted-foreground">—</span>;
          const status = getBatchStatus(expiryDate);
          const colorClass =
            status === 'EXPIRED' ? 'text-destructive' : status === 'EXPIRING_SOON' ? 'text-warning' : '';
          return <FormattedDate value={expiryDate} dateFormat="P" className={`font-mono ${colorClass}`} />;
        },
      },
      {
        id: 'status',
        header: 'Status',
        cell: ({ row }) => {
          const status = getBatchStatus(row.original.expiryDate);
          const config = STATUS_CONFIG[status];
          return <Badge variant={config.variant}>{config.label}</Badge>;
        },
      },
      {
        id: 'actions',
        header: '',
        cell: ({ row }) => (
          <RowActions
            actions={[
              {
                id: 'view',
                icon: Eye,
                label: 'View',
                onClick: () => navigate(`batches/${row.original.id}`),
              },
            ]}
          />
        ),
        enableSorting: false,
        enableHiding: false,
      },
    ],
    [uomSymbol, navigate],
  );

  const { table } = useDataTable({
    columns,
    serverState: response,
    slug: `inventory-item-${itemId}-lots`,
    label: 'lot',
    enableRowSelection: false,
    enableSorting: true,
    onStatePush: () => queryClient.invalidateQueries({ queryKey: [...INVENTORY_ITEM_BATCHES_KEY(itemId)] }),
  });

  return (
    <DataTable
      table={table}
      mode="compact"
      isLoading={isLoading}
      emptyStateConfig={{
        icon: Boxes,
        title: 'No lots',
        description: 'Lot-tracked stock is created when goods are received or opening stock is added.',
      }}
    />
  );
};
