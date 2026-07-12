import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@vritti/quantum-ui/Button';
import {
  type ColumnDef,
  DataTable,
  NumberCell,
  RowActions,
  StringCell,
  useDataTable,
} from '@vritti/quantum-ui/DataTable';
import { Dialog } from '@vritti/quantum-ui/Dialog';
import { useConfirm, useDialog } from '@vritti/quantum-ui/hooks';
import { MapPin, Package, Pencil, Plus, Trash2 } from 'lucide-react';
import type React from 'react';
import { useCallback, useMemo } from 'react';
import type { InventoryItemLocationData } from '@/schemas/inventory-item-locations';
import {
  INVENTORY_ITEM_LOCATIONS_KEY,
  useDeleteInventoryItemLocation,
  useInventoryItemLocationsTable,
} from '@/site/hooks/inventory-items';
import { AddInventoryItemLocationForm } from '../forms/AddInventoryItemLocationForm';
import { EditInventoryItemLocationForm } from '../forms/EditInventoryItemLocationForm';

interface LocationsTabProps {
  inventoryItemId: string;
  uomSymbol: string | null;
}

export const LocationsTab: React.FC<LocationsTabProps> = ({ inventoryItemId, uomSymbol }) => {
  const queryClient = useQueryClient();
  const confirm = useConfirm();
  const addDialog = useDialog();
  const { data: response, isLoading } = useInventoryItemLocationsTable(inventoryItemId);
  const deleteMutation = useDeleteInventoryItemLocation(inventoryItemId);

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
        cell: ({ row }) => <StringCell value={row.original.locationName} />,
        enableSorting: true,
      },
      {
        accessorKey: 'locationPath',
        header: 'Path',
        cell: ({ row }) => <span className="text-xs text-muted-foreground">{row.original.locationPath ?? '—'}</span>,
        enableSorting: false,
      },
      {
        accessorKey: 'reorderLevel',
        header: 'Min. Stock Level',
        cell: ({ row }) => (
          <span className="font-mono">
            <NumberCell value={row.original.reorderLevel} /> {uomSymbol}
          </span>
        ),
        enableSorting: true,
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
                      inventoryItemId={inventoryItemId}
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
    [inventoryItemId, uomSymbol, handleDelete],
  );

  const { table } = useDataTable({
    columns,
    serverState: response,
    slug: `inventory-item-${inventoryItemId}-locations`,
    label: 'config',
    enableRowSelection: false,
    enableSorting: true,
    onStatePush: () => queryClient.invalidateQueries({ queryKey: [...INVENTORY_ITEM_LOCATIONS_KEY(inventoryItemId)] }),
  });

  return (
    <>
      <DataTable
        table={table}
        mode="tab"
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
        icon={Package}
        title="Add Location"
        description="Set a minimum stock level for a storage location."
        content={(close) => (
          <AddInventoryItemLocationForm inventoryItemId={inventoryItemId} onSuccess={close} onCancel={close} />
        )}
      />
    </>
  );
};
