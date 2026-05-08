import { useQueryClient } from '@tanstack/react-query';
import { Badge } from '@vritti/quantum-ui/Badge';
import { Button } from '@vritti/quantum-ui/Button';
import { type ColumnDef, DataTable, RowActions, useDataTable } from '@vritti/quantum-ui/DataTable';
import { Dialog } from '@vritti/quantum-ui/Dialog';
import { useConfirm, useDialog } from '@vritti/quantum-ui/hooks';
import { MapPin, Pencil, Plus, Trash2 } from 'lucide-react';
import type React from 'react';
import { useCallback, useMemo } from 'react';
import {
  INVENTORY_ITEM_LOCATIONS_KEY,
  useDeleteInventoryItemLocation,
  useInventoryItemLocationsTable,
} from '@/hooks/inventory-items';
import type { InventoryItemLocationData } from '@/schemas/inventory-item-locations';
import { AddInventoryItemLocationForm } from '../forms/AddInventoryItemLocationForm';
import { EditInventoryItemLocationForm } from '../forms/EditInventoryItemLocationForm';

interface LocationsTabProps {
  itemId: string;
  uomSymbol: string | null;
}

export const LocationsTab: React.FC<LocationsTabProps> = ({ itemId, uomSymbol }) => {
  const queryClient = useQueryClient();
  const confirm = useConfirm();
  const addDialog = useDialog();
  const { data: response, isLoading } = useInventoryItemLocationsTable(itemId);
  const deleteMutation = useDeleteInventoryItemLocation(itemId);

  const handleDelete = useCallback(
    async (row: InventoryItemLocationData) => {
      const confirmed = await confirm({
        title: 'Remove config?',
        description: `Remove minimum stock level for "${row.locationName ?? 'this location'}"?`,
        confirmLabel: 'Remove',
        variant: 'destructive',
      });
      if (confirmed) deleteMutation.mutate(row.id);
    },
    [confirm, deleteMutation],
  );

  const columns = useMemo<ColumnDef<InventoryItemLocationData>[]>(
    () => [
      {
        accessorKey: 'locationName',
        header: 'Location',
        cell: ({ row }) => row.original.locationName ?? '—',
        enableSorting: true,
      },
      {
        accessorKey: 'reorderLevel',
        header: 'Min. Stock Level',
        cell: ({ row }) => (
          <span className="font-mono">
            {row.original.reorderLevel} {uomSymbol}
          </span>
        ),
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
          const { stockedQuantity, availableQuantity, reorderLevel } = row.original;
          if (stockedQuantity === 0) return <Badge variant="destructive">No Stock</Badge>;
          if (reorderLevel > 0 && availableQuantity <= reorderLevel) {
            return <Badge variant="secondary">Low Stock</Badge>;
          }
          return <Badge variant="default">In Stock</Badge>;
        },
      },
      {
        id: 'actions',
        header: '',
        cell: ({ row }) => (
          <RowActions
            actions={[
              {
                id: 'edit',
                icon: Pencil,
                label: 'Edit',
                dialog: {
                  title: 'Edit Min. Stock Level',
                  description: `Update the reorder threshold for ${row.original.locationName ?? 'this location'}.`,
                  content: (close) => (
                    <EditInventoryItemLocationForm
                      itemId={itemId}
                      locationConfigId={row.original.id}
                      locationName={row.original.locationName}
                      currentReorderLevel={row.original.reorderLevel}
                      uomSymbol={uomSymbol}
                      onSuccess={close}
                      onCancel={close}
                    />
                  ),
                },
              },
              {
                id: 'delete',
                icon: Trash2,
                label: 'Delete',
                variant: 'destructive',
                onClick: () => handleDelete(row.original),
              },
            ]}
          />
        ),
        enableSorting: false,
        enableHiding: false,
      },
    ],
    [itemId, uomSymbol, handleDelete],
  );

  const { table } = useDataTable({
    columns,
    serverState: response,
    slug: `inventory-item-${itemId}-locations`,
    label: 'config',
    enableRowSelection: false,
    enableSorting: true,
    onStatePush: () => queryClient.invalidateQueries({ queryKey: [...INVENTORY_ITEM_LOCATIONS_KEY(itemId)] }),
  });

  return (
    <>
      <DataTable
        table={table}
        mode="compact"
        isLoading={isLoading}
        toolbarActions={{
          actions: (
            <Button size="sm" startAdornment={<Plus className="size-4" />} onClick={addDialog.open}>
              Add Location
            </Button>
          ),
        }}
        emptyStateConfig={{
          icon: MapPin,
          title: 'No Locations Allocated for this item',
          description: 'Add a location to set minimum stock levels for this item.',
          action: (
            <Button startAdornment={<Plus className="size-4" />} onClick={addDialog.open}>
              Add Location
            </Button>
          ),
        }}
      />

      <Dialog
        handle={addDialog}
        title="Add Location"
        description="Set a minimum stock level for a storage location."
        content={(close) => <AddInventoryItemLocationForm itemId={itemId} onSuccess={close} onCancel={close} />}
      />
    </>
  );
};
