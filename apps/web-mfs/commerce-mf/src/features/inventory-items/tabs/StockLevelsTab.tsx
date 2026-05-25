import { Badge } from '@vritti/quantum-ui/Badge';
import { type ColumnDef, DataTable, useDataTable } from '@vritti/quantum-ui/DataTable';
import { MapPin } from 'lucide-react';
import type React from 'react';
import { useMemo } from 'react';
import { useInventoryItemStocks } from '@/hooks/inventory-items';
import type { InventoryItemStockData } from '@/schemas/inventory-items';

interface StockLevelsTabProps {
  inventoryItemId: string;
  uomSymbol: string | null;
}

export const StockLevelsTab: React.FC<StockLevelsTabProps> = ({ inventoryItemId, uomSymbol }) => {
  const { data: stocks = [], isLoading } = useInventoryItemStocks(inventoryItemId);

  const columns = useMemo<ColumnDef<InventoryItemStockData>[]>(
    () => [
      {
        accessorKey: 'locationName',
        header: 'Location',
        cell: ({ row }) => row.original.locationName ?? '—',
        enableSorting: true,
      },
      {
        accessorKey: 'locationPath',
        header: 'Path',
        cell: ({ row }) => <span className="text-xs text-muted-foreground">{row.original.locationPath ?? '—'}</span>,
        enableSorting: false,
      },
      {
        accessorKey: 'stockedQuantity',
        header: 'Stocked',
        cell: ({ row }) => (
          <span className="font-mono">
            {row.original.stockedQuantity} {uomSymbol}
          </span>
        ),
        enableSorting: true,
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
        accessorKey: 'reorderLevel',
        header: 'Min. Stock Level',
        cell: ({ row }) =>
          row.original.reorderLevel != null ? (
            <span className="font-mono">
              {row.original.reorderLevel} {uomSymbol}
            </span>
          ) : (
            <span className="text-xs text-muted-foreground">—</span>
          ),
      },
      {
        id: 'status',
        header: 'Status',
        cell: ({ row }) => {
          const { stockedQuantity, availableQuantity, reorderLevel } = row.original;
          if (stockedQuantity === 0) return <Badge variant="destructive">No Stock</Badge>;
          if (reorderLevel != null && reorderLevel > 0 && availableQuantity <= reorderLevel) {
            return <Badge variant="secondary">Low Stock</Badge>;
          }
          return <Badge variant="default">In Stock</Badge>;
        },
      },
    ],
    [uomSymbol],
  );

  const serverState = useMemo(() => ({ result: stocks, count: stocks.length }), [stocks]);

  const { table } = useDataTable({
    columns,
    serverState,
    slug: `inventory-item-${inventoryItemId}-stock-levels`,
    label: 'stock level',
    enableRowSelection: false,
    enableSorting: true,
  });

  return (
    <DataTable
      table={table}
      mode="tab"
      isLoading={isLoading}
      emptyStateConfig={{
        icon: MapPin,
        title: 'No stock levels',
        description: 'This item has no stock and no configured locations yet.',
      }}
    />
  );
};
