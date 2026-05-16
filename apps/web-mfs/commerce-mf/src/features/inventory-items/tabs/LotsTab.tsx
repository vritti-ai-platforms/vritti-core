import { useQueryClient } from '@tanstack/react-query';
import { Badge } from '@vritti/quantum-ui/Badge';
import { type ColumnDef, DataTable, useDataTable } from '@vritti/quantum-ui/DataTable';
import { FormattedDate } from '@vritti/quantum-ui/FormattedDate';
import { Layers } from 'lucide-react';
import type React from 'react';
import { useMemo } from 'react';
import { INVENTORY_ITEM_LOTS_KEY, useInventoryItemLotsTable } from '@/hooks/inventory-items';
import type { InventoryItemLotData, InventoryItemLotStatus } from '@/schemas/inventory-item-lots';

interface LotsTabProps {
  itemId: string;
  uomSymbol: string | null;
}

function getLotStatus(expiryDate: string): InventoryItemLotStatus {
  const diffMs = new Date(expiryDate).getTime() - Date.now();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays < 0) return 'EXPIRED';
  if (diffDays <= 7) return 'EXPIRING_SOON';
  return 'FRESH';
}

const STATUS_CONFIG: Record<
  InventoryItemLotStatus,
  { label: string; variant: 'default' | 'secondary' | 'outline' | 'destructive' | 'ghost' }
> = {
  EXPIRED: { label: 'Expired', variant: 'destructive' },
  EXPIRING_SOON: { label: 'Expiring Soon', variant: 'secondary' },
  FRESH: { label: 'Fresh', variant: 'default' },
};

export const LotsTab: React.FC<LotsTabProps> = ({ itemId, uomSymbol }) => {
  const queryClient = useQueryClient();
  const { data: response, isLoading } = useInventoryItemLotsTable(itemId);

  const columns = useMemo<ColumnDef<InventoryItemLotData>[]>(
    () => [
      {
        accessorKey: 'lotNumber',
        header: 'Lot #',
        cell: ({ row }) => <span className="font-mono">{row.original.lotNumber}</span>,
        enableSorting: true,
      },
      {
        accessorKey: 'manufacturingDate',
        header: 'Mfg. Date',
        cell: ({ row }) => (
          <FormattedDate value={row.original.manufacturingDate} dateFormat="P" className="font-mono" />
        ),
        enableSorting: true,
      },
      {
        accessorKey: 'expiryDate',
        header: 'Expiry Date',
        cell: ({ row }) => {
          const status = getLotStatus(row.original.expiryDate);
          const colorClass =
            status === 'EXPIRED' ? 'text-destructive' : status === 'EXPIRING_SOON' ? 'text-warning' : '';
          return <FormattedDate value={row.original.expiryDate} dateFormat="P" className={`font-mono ${colorClass}`} />;
        },
        enableSorting: true,
      },
      {
        accessorKey: 'stockedQuantity',
        header: 'Stocked',
        cell: ({ row }) => (
          <span className="font-mono">
            {row.original.stockedQuantity} {uomSymbol}
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
        id: 'status',
        header: 'Status',
        cell: ({ row }) => {
          const status = getLotStatus(row.original.expiryDate);
          const config = STATUS_CONFIG[status];
          return <Badge variant={config.variant}>{config.label}</Badge>;
        },
      },
    ],
    [uomSymbol],
  );

  const { table } = useDataTable({
    columns,
    serverState: response,
    slug: `inventory-item-${itemId}-lots`,
    label: 'lot',
    enableRowSelection: false,
    enableSorting: true,
    onStatePush: () => queryClient.invalidateQueries({ queryKey: [...INVENTORY_ITEM_LOTS_KEY(itemId)] }),
  });

  return (
    <DataTable
      table={table}
      mode="compact"
      isLoading={isLoading}
      emptyStateConfig={{
        icon: Layers,
        title: 'No lots',
        description: 'Lots are created when goods with lot tracking are received or opening stock is added.',
      }}
    />
  );
};
