import { useQueryClient } from '@tanstack/react-query';
import { Badge } from '@vritti/quantum-ui/Badge';
import {
  type ColumnDef,
  DataTable,
  DateCell,
  RowActions,
  StringCell,
  useDataTable,
} from '@vritti/quantum-ui/DataTable';
import { useFormatters } from '@vritti/quantum-ui/hooks';
import { Boxes, Eye } from 'lucide-react';
import type React from 'react';
import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { INVENTORY_ITEM_QUANTS_KEY, useInventoryItemQuantsTable } from '@/hooks/site/inventory-items';
import type { InventoryItemQuantData, InventoryItemQuantStatus } from '@/schemas/inventory-item-quants';
import { LocationFilter } from '@/selectors/location';
import { LotFilter } from '@/selectors/lot';

interface QuantsTabProps {
  inventoryItemId: string;
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

export const QuantsTab: React.FC<QuantsTabProps> = ({ inventoryItemId }) => {
  const queryClient = useQueryClient();
  const fmt = useFormatters();
  const navigate = useNavigate();
  const inventoryItemQuantsTableQuery = useInventoryItemQuantsTable(inventoryItemId);

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
        cell: ({ row }) => <StringCell value={row.original.locationName} />,
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
        cell: ({ row }) => <span className="font-mono">{fmt.quantity(row.original.display.quantity).primary}</span>,
      },
      {
        accessorKey: 'reservedQuantity',
        header: 'Reserved',
        cell: ({ row }) => (
          <span className="font-mono">{fmt.quantity(row.original.display.reservedQuantity).primary}</span>
        ),
      },
      {
        accessorKey: 'availableQuantity',
        header: 'Available',
        cell: ({ row }) => (
          <span className="font-mono font-semibold">
            {fmt.quantity(row.original.display.availableQuantity).primary}
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
    [fmt, navigate],
  );

  const inventoryItemQuantsTable = useDataTable({
    columns,
    query: inventoryItemQuantsTableQuery,
    slug: `inventory-item-${inventoryItemId}-quants`,
    label: 'quant',
    enableRowSelection: false,
    enableSorting: true,
    onStatePush: () => queryClient.invalidateQueries({ queryKey: [...INVENTORY_ITEM_QUANTS_KEY(inventoryItemId)] }),
  });

  return (
    <DataTable
      table={inventoryItemQuantsTable}
      mode="tab"
      filters={[
        <LocationFilter key="locationId" />,
        <LotFilter key="lotId" params={{ inventoryItemId: inventoryItemId }} />,
      ]}
      emptyStateConfig={{
        icon: Boxes,
        title: 'No quants',
        description: 'Quants are created when goods are received or opening stock is added.',
      }}
    />
  );
};
