import { useQueryClient } from '@tanstack/react-query';
import { Badge } from '@vritti/quantum-ui/Badge';
import { type ColumnDef, DataTable, DateCell, NumberCell, RowActions, StringCell, useDataTable } from '@vritti/quantum-ui/DataTable';
import { LocationFilter } from '@vritti/quantum-ui/selects/location';
import { LotFilter } from '@vritti/quantum-ui/selects/lot';
import { Boxes, Eye } from 'lucide-react';
import type React from 'react';
import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { INVENTORY_ITEM_QUANTS_KEY, useInventoryItemQuantsTable } from '@/hooks/inventory-items';
import type { InventoryItemQuantData, InventoryItemQuantStatus } from '@/schemas/inventory-item-quants';

interface QuantsTabProps {
  inventoryItemId: string;
  uomSymbol: string | null;
}

function getQuantStatus(expiryDate: string | null): InventoryItemQuantStatus {
  if (!expiryDate) return 'FRESH';
  const diffMs = new Date(expiryDate).getTime() - Date.now();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays < 0) return 'EXPIRED';
  if (diffDays <= 7) return 'EXPIRING_SOON';
  return 'FRESH';
}

const STATUS_CONFIG: Record<
  InventoryItemQuantStatus,
  { label: string; variant: 'default' | 'secondary' | 'outline' | 'destructive' | 'ghost' }
> = {
  EXPIRED: { label: 'Expired', variant: 'destructive' },
  EXPIRING_SOON: { label: 'Expiring Soon', variant: 'secondary' },
  FRESH: { label: 'Fresh', variant: 'default' },
};

export const QuantsTab: React.FC<QuantsTabProps> = ({ inventoryItemId, uomSymbol }) => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { data: response, isLoading } = useInventoryItemQuantsTable(inventoryItemId);

  const columns = useMemo<ColumnDef<InventoryItemQuantData>[]>(
    () => [
      {
        accessorKey: 'lotNumber',
        header: 'Lot #',
        cell: ({ row }) => <StringCell value={row.original.lotNumber} mono />,
      },
      {
        accessorKey: 'locationName',
        header: 'Location',
        cell: ({ row }) => row.original.locationName ?? '—',
      },
      {
        accessorKey: 'locationPath',
        header: 'Path',
        cell: ({ row }) => <span className="text-xs text-muted-foreground">{row.original.locationPath ?? '—'}</span>,
        enableSorting: false,
      },
      {
        accessorKey: 'quantity',
        header: 'Qty',
        cell: ({ row }) => (
          <span className="font-mono">
            <NumberCell value={row.original.quantity} /> {uomSymbol}
          </span>
        ),
      },
      {
        accessorKey: 'reservedQuantity',
        header: 'Reserved',
        cell: ({ row }) => <NumberCell value={row.original.reservedQuantity} />,
      },
      {
        accessorKey: 'availableQuantity',
        header: 'Available',
        cell: ({ row }) => (
          <span className="font-mono font-semibold">
            <NumberCell value={row.original.availableQuantity} /> {uomSymbol}
          </span>
        ),
      },
      {
        accessorKey: 'expiryDate',
        header: 'Expiry Date',
        cell: ({ row }) => {
          const { expiryDate } = row.original;
          if (!expiryDate) return <span className="text-muted-foreground">—</span>;
          const status = getQuantStatus(expiryDate);
          const colorClass =
            status === 'EXPIRED' ? 'text-destructive' : status === 'EXPIRING_SOON' ? 'text-warning' : '';
          return <DateCell value={expiryDate} className={`font-mono ${colorClass}`} />;
        },
      },
      {
        id: 'status',
        header: 'Status',
        cell: ({ row }) => {
          const status = getQuantStatus(row.original.expiryDate);
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
                onClick: () => navigate(`quants/${row.original.id}`),
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
    slug: `inventory-item-${inventoryItemId}-quants`,
    label: 'quant',
    enableRowSelection: false,
    enableSorting: true,
    onStatePush: () => queryClient.invalidateQueries({ queryKey: [...INVENTORY_ITEM_QUANTS_KEY(inventoryItemId)] }),
  });

  return (
    <DataTable
      table={table}
      mode="tab"
      isLoading={isLoading}
      filters={[<LocationFilter key="locationId" />, <LotFilter key="lotId" params={{ inventoryItemId: inventoryItemId }} />]}
      emptyStateConfig={{
        icon: Boxes,
        title: 'No quants',
        description: 'Quants are created when goods are received or opening stock is added.',
      }}
    />
  );
};
