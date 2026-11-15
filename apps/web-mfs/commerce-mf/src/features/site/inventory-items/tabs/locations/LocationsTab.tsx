import { useQueryClient } from '@tanstack/react-query';
import { SITE_INVENTORY_ITEMS } from '@vritti/commerce-permissions/inventory-items';
import { Button } from '@vritti/quantum-ui/Button';
import { type ColumnDef, DataTable, RowActions, StringCell, useDataTable } from '@vritti/quantum-ui/DataTable';
import { Dialog } from '@vritti/quantum-ui/Dialog';
import { useConfirm, useDialog } from '@vritti/quantum-ui/hooks';
import { CompactSwitch } from '@vritti/quantum-ui/Switch';
import { MapPin, Package, Plus, Trash2 } from 'lucide-react';
import type React from 'react';
import { useCallback, useMemo } from 'react';
import {
  INVENTORY_ITEM_LOCATIONS_KEY,
  useDeleteInventoryItemLocation,
  useInventoryItemLocationsTable,
  useUpdateInventoryItemLocation,
} from '@/hooks/site/inventory-items';
import type { InventoryItemLocationData } from '@/schemas/inventory-item-locations';
import { AddInventoryItemLocationForm } from './forms/AddInventoryItemLocationForm';

interface LocationsTabProps {
  inventoryItemId: string;
}

export const LocationsTab: React.FC<LocationsTabProps> = ({ inventoryItemId }) => {
  const queryClient = useQueryClient();
  const confirm = useConfirm();
  const addDialog = useDialog();
  const inventoryItemLocationsTableQuery = useInventoryItemLocationsTable(inventoryItemId);
  const updateMutation = useUpdateInventoryItemLocation(inventoryItemId);
  const deleteMutation = useDeleteInventoryItemLocation(inventoryItemId);

  const handleDelete = useCallback(
    async (row: InventoryItemLocationData) => {
      const locationName = row.locationName ?? 'this location';
      const confirmed = await confirm({
        title: `Remove ${locationName}?`,
        description: `${locationName} will no longer be a fixed location for this item. Stock already there stays.`,
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
        accessorKey: 'isBlocked',
        header: 'Blocked',
        cell: ({ row }) => (
          <span className="inline-flex items-center gap-2">
            <CompactSwitch
              checked={row.original.isBlocked}
              permission={SITE_INVENTORY_ITEMS.locations.edit}
              disabled={updateMutation.isPending && updateMutation.variables?.locationConfigId === row.original.id}
              onCheckedChange={(isBlocked) => updateMutation.mutate({ locationConfigId: row.original.id, isBlocked })}
              aria-label={`Block putaway into ${row.original.locationName ?? 'this location'}`}
            />
            <span className="text-xs text-muted-foreground">{row.original.isBlocked ? 'No new putaway' : 'Open'}</span>
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
                id: 'delete',
                icon: Trash2,
                label: 'Remove',
                variant: 'destructive',
                permission: SITE_INVENTORY_ITEMS.locations.delete,
                onClick: () => handleDelete(row.original),
              },
            ]}
          />
        ),
        enableSorting: false,
        enableHiding: false,
      },
    ],
    [handleDelete, updateMutation],
  );

  const inventoryItemLocationsTable = useDataTable({
    columns,
    query: inventoryItemLocationsTableQuery,
    slug: `inventory-item-${inventoryItemId}-locations`,
    label: 'location',
    enableRowSelection: false,
    enableSorting: true,
    onStatePush: () => queryClient.invalidateQueries({ queryKey: INVENTORY_ITEM_LOCATIONS_KEY(inventoryItemId) }),
  });

  return (
    <>
      <DataTable
        table={inventoryItemLocationsTable}
        mode="tab"
        permission={SITE_INVENTORY_ITEMS.locations.view}
        toolbarActions={{
          actions: (
            <Button
              size="sm"
              startAdornment={<Plus className="size-4" />}
              onClick={addDialog.open}
              permission={SITE_INVENTORY_ITEMS.locations.add}
            >
              Add Location
            </Button>
          ),
        }}
        emptyStateConfig={{
          icon: MapPin,
          title: 'No fixed locations',
          description: 'Give this item a fixed location so putaway sends its stock there first.',
          action: (
            <Button
              startAdornment={<Plus className="size-4" />}
              onClick={addDialog.open}
              permission={SITE_INVENTORY_ITEMS.locations.add}
            >
              Add Location
            </Button>
          ),
        }}
      />

      <Dialog
        handle={addDialog}
        icon={Package}
        title="Add Fixed Location"
        description="A location this item is always put away to first, unless it is blocked."
        content={(close) => (
          <AddInventoryItemLocationForm inventoryItemId={inventoryItemId} onSuccess={close} onCancel={close} />
        )}
      />
    </>
  );
};
