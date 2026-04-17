import { useQueryClient } from '@tanstack/react-query';
import { Badge } from '@vritti/quantum-ui/Badge';
import { Button } from '@vritti/quantum-ui/Button';
import { type ColumnDef, DataTable, useDataTable } from '@vritti/quantum-ui/DataTable';
import { DetailField } from '@vritti/quantum-ui/DetailField';
import { Dialog } from '@vritti/quantum-ui/Dialog';
import { Empty } from '@vritti/quantum-ui/Empty';
import { useConfirm, useDialog } from '@vritti/quantum-ui/hooks';
import { Typography } from '@vritti/quantum-ui/Typography';
import { MapPin, Pencil, Plus, Trash2 } from 'lucide-react';
import type React from 'react';
import { useMemo } from 'react';
import {
  LOCATION_CHILDREN_TABLE_KEY,
  useDeleteLocation,
  useLocationById,
  useLocationChildrenTable,
} from '@/hooks/storage-locations';
import type { StorageLocationData } from '@/schemas/storage-locations';
import { AddLocationDialog } from '../forms/AddLocationDialog';
import { EditLocationDialog } from '../forms/EditLocationDialog';

interface LocationDetailPanelProps {
  selectedId: string | null;
  onSelectLocation: (id: string | null) => void;
}

export const LocationDetailPanel: React.FC<LocationDetailPanelProps> = ({ selectedId, onSelectLocation }) => {
  const queryClient = useQueryClient();
  const confirm = useConfirm();
  const addChildDialog = useDialog();
  const editDialog = useDialog();
  const deleteMutation = useDeleteLocation();
  const { data: location, isLoading: isLocationLoading } = useLocationById(selectedId);
  const locationId = location?.id ?? null;
  const { data: childrenResponse, isLoading: isChildrenLoading } = useLocationChildrenTable(locationId);
  const canAddChild = location?.locationRole === 'ZONE';

  const columns = useMemo<ColumnDef<StorageLocationData>[]>(
    () => [
      {
        accessorKey: 'name',
        header: 'Name',
      },
      {
        accessorKey: 'code',
        header: 'Code',
      },
      {
        accessorKey: 'sortOrder',
        header: 'Sort Order',
      },
      {
        accessorKey: 'locationRole',
        header: 'Role',
        cell: ({ row }) => row.original.locationRole,
      },
      {
        accessorKey: 'isActive',
        header: 'Status',
        cell: ({ row }) => (row.original.isActive ? 'Active' : 'Inactive'),
      },
      {
        id: 'open',
        header: '',
        cell: ({ row }) => (
          <Button variant="ghost" size="sm" onClick={() => onSelectLocation(row.original.id)}>
            Open
          </Button>
        ),
        enableSorting: false,
        enableHiding: false,
      },
    ],
    [onSelectLocation],
  );

  const { table } = useDataTable({
    columns,
    serverState: childrenResponse,
    slug: `storage-location-${selectedId ?? 'none'}-children`,
    label: 'child location',
    enableRowSelection: false,
    onStatePush: () => {
      if (locationId) {
        queryClient.invalidateQueries({ queryKey: LOCATION_CHILDREN_TABLE_KEY(locationId) });
      }
    },
  });

  if (selectedId && isLocationLoading) {
    return <div className="flex items-center justify-center h-full text-sm text-muted-foreground">Loading…</div>;
  }

  if (!location) {
    return (
      <Empty
        icon={<MapPin />}
        title="Select a location"
        description="Pick a location from the tree to view details and child locations."
        className="h-full"
      />
    );
  }

  const handleDelete = async () => {
    const confirmed = await confirm({
      title: `Delete "${location.name}"?`,
      description: 'This storage location will be permanently removed.',
      confirmLabel: 'Delete',
      variant: 'destructive',
    });
    if (confirmed) {
      deleteMutation.mutate(location.id, {
        onSuccess: () => onSelectLocation(location.parentId),
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3 flex-wrap">
          <Typography variant="h3">{location.name}</Typography>
          <Badge
            variant={location.isActive ? 'secondary' : 'outline'}
            className={location.isActive ? 'bg-success/15 text-success' : ''}
          >
            {location.isActive ? 'Active' : 'Inactive'}
          </Badge>
          <Badge variant="outline">{location.locationRole}</Badge>
          <Badge variant="outline">{location.code}</Badge>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={editDialog.open}
            startAdornment={<Pencil className="size-3.5" />}
          >
            Edit
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleDelete}
            disabled={!location.canDelete || deleteMutation.isPending}
            isLoading={deleteMutation.isPending}
            className="text-destructive hover:text-destructive"
            startAdornment={<Trash2 className="size-3.5" />}
          >
            Delete
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-x-8 gap-y-4">
        <DetailField label="Sort Order" value={location.sortOrder} />
        <DetailField label="Role" value={location.locationRole} />
        <DetailField label="Child Locations" value={childrenResponse?.count ?? 0} />
        <DetailField label="Parent" value={location.parentId ?? '—'} />
        <DetailField label="Area" value={location.area ?? '—'} />
        <DetailField label="Address" value={location.address ?? '—'} className="col-span-2" />
      </div>

      <div>
        <Typography variant="overline" intent="muted" className="mb-3">
          Child Locations ({childrenResponse?.count ?? 0})
        </Typography>
        <DataTable
          table={table}
          mode="compact"
          isLoading={isChildrenLoading}
          toolbarActions={{
            actions: (
              <Button
                size="sm"
                startAdornment={<Plus className="size-4" />}
                onClick={addChildDialog.open}
                disabled={!canAddChild}
                title={!canAddChild ? 'Only ZONE locations can have child locations.' : undefined}
              >
                Add Child Location
              </Button>
            ),
          }}
          emptyStateConfig={{
            icon: MapPin,
            title: 'No child locations',
            description: 'This location has no direct children.',
          }}
        />
      </div>

      <Dialog
        handle={addChildDialog}
        title="Add Child Location"
        description={`Add a child location under "${location.name}".`}
        content={(close) => (
          <AddLocationDialog
            defaultParentId={location.id}
            onSuccess={() => {
              if (locationId) {
                queryClient.invalidateQueries({ queryKey: LOCATION_CHILDREN_TABLE_KEY(locationId) });
              }
              close();
            }}
            onCancel={close}
          />
        )}
      />

      <Dialog
        handle={editDialog}
        title="Edit Location"
        description="Update the details for this location."
        content={(close) => <EditLocationDialog location={location} onSuccess={close} onCancel={close} />}
      />
    </div>
  );
};
