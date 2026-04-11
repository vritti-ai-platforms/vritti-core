import { useQueryClient } from '@tanstack/react-query';
import { Badge } from '@vritti/quantum-ui/Badge';
import { type ColumnDef, DataTable, useDataTable } from '@vritti/quantum-ui/DataTable';
import { buildSlug } from '@vritti/quantum-ui/slug';
import { Package } from 'lucide-react';
import type React from 'react';
import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { INVENTORY_ITEM_LEVELS_KEY, useInventoryItemLevelsTable } from '@/hooks/inventory-items';
import type { InventoryLevelData } from '@/schemas/inventory-items';

interface LevelsTabProps {
  itemId: string;
  uomSymbol: string | null;
}

export const LevelsTab: React.FC<LevelsTabProps> = ({ itemId, uomSymbol }) => {
  const queryClient = useQueryClient();
  const { data: response, isLoading } = useInventoryItemLevelsTable(itemId);
  const columns = useMemo<ColumnDef<InventoryLevelData>[]>(
    () => [
      {
        accessorKey: 'locationName',
        header: 'Location',
        cell: ({ row }) =>
          row.original.locationName ? (
            <Link
              to={`/storage-locations/${buildSlug(row.original.locationName, row.original.locationId)}`}
              className="text-primary hover:underline"
            >
              {row.original.locationName}
            </Link>
          ) : (
            '—'
          ),
      },
      {
        accessorKey: 'stockedQuantity',
        header: 'Stocked',
        cell: ({ row }) => <span className="font-mono">{row.original.stockedQuantity} {uomSymbol}</span>,
      },
      {
        accessorKey: 'reservedQuantity',
        header: 'Reserved',
        cell: ({ row }) => <span className="font-mono">{row.original.reservedQuantity} {uomSymbol}</span>,
      },
      {
        accessorKey: 'availableQuantity',
        header: 'Available',
        cell: ({ row }) => <span className="font-mono font-medium">{row.original.availableQuantity} {uomSymbol}</span>,
      },
      {
        accessorKey: 'reorderLevel',
        header: 'Reorder Level',
        cell: ({ row }) => <span className="font-mono">{row.original.reorderLevel} {uomSymbol}</span>,
      },
      {
        id: 'status',
        header: 'Status',
        cell: ({ row }) => {
          const isLow = row.original.availableQuantity <= row.original.reorderLevel && row.original.reorderLevel > 0;
          return isLow ? <Badge variant="destructive">Low Stock</Badge> : <Badge variant="secondary">In Stock</Badge>;
        },
      },
    ],
    [uomSymbol],
  );

  const { table } = useDataTable({
    columns,
    serverState: response,
    slug: `inventory-item-${itemId}-levels`,
    label: 'level',
    enableRowSelection: false,
    enableSorting: true,
    onStatePush: () => queryClient.invalidateQueries({ queryKey: [...INVENTORY_ITEM_LEVELS_KEY(itemId)] }),
  });

  return (
    <DataTable
      table={table}
      mode="compact"
      isLoading={isLoading}
      emptyStateConfig={{
        icon: Package,
        title: 'No stock levels',
        description: 'Stock is updated when goods are received or orders are placed.',
      }}
    />
  );
};
