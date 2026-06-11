import { useQueryClient } from '@tanstack/react-query';
import { Badge } from '@vritti/quantum-ui/Badge';
import { Button } from '@vritti/quantum-ui/Button';
import {
  type ColumnDef,
  DataTable,
  NumberCell,
  type RowAction,
  RowActions,
  useDataTable,
} from '@vritti/quantum-ui/DataTable';
import { DetailField, DetailSection } from '@vritti/quantum-ui/DetailField';
import { Dialog } from '@vritti/quantum-ui/Dialog';
import { Empty } from '@vritti/quantum-ui/Empty';
import { useConfirm, useDialog, useFormatters } from '@vritti/quantum-ui/hooks';
import { PageContentDetails } from '@vritti/quantum-ui/PageContent';
import { Typography } from '@vritti/quantum-ui/Typography';
import { Boxes, Eye, MapPin, Pencil, Plus, Trash2 } from 'lucide-react';
import type React from 'react';
import { useMemo } from 'react';
import {
  LOCATION_CHILDREN_TABLE_KEY,
  LOCATION_ITEMS_TABLE_KEY,
  useDeleteLocation,
  useLocationById,
  useLocationChildrenTable,
  useLocationItemsTable,
} from '@/hooks/locations';
import { type LocationData, type LocationItemRow, LocationRoleLabels } from '@/schemas/locations';
import { AddLocationDialog } from '../forms/AddLocationDialog';
import { EditLocationDialog } from '../forms/EditLocationDialog';
import { LocationDetailPanelSkeleton } from './LocationDetailPanelSkeleton';
import { LocationItemQuantsDialogContent } from './LocationItemQuantsDialogContent';
import { LOCATION_ROLE_ICON } from './LocationRow';

interface LocationDetailPanelProps {
  selectedId: string | null;
  onSelectLocation: (id: string | null) => void;
}

export const LocationDetailPanel: React.FC<LocationDetailPanelProps> = ({ selectedId, onSelectLocation }) => {
  const { data: location, isLoading } = useLocationById(selectedId);

  return (
    <PageContentDetails
      className="flex flex-col"
      isLoading={!!selectedId && (isLoading || !location)}
      loadingContent={<LocationDetailPanelSkeleton />}
      isEmpty={!selectedId}
      emptyState={
        <Empty
          icon={<MapPin />}
          title="Select a location"
          description="Pick a location from the tree to view details and child locations."
        />
      }
    >
      {location ? <LocationDetailContent location={location} onSelectLocation={onSelectLocation} /> : null}
    </PageContentDetails>
  );
};

interface LocationDetailContentProps {
  location: LocationData;
  onSelectLocation: (id: string | null) => void;
}

const LocationDetailContent: React.FC<LocationDetailContentProps> = ({ location, onSelectLocation }) => {
  const queryClient = useQueryClient();
  const confirm = useConfirm();
  const addChildDialog = useDialog();
  const editDialog = useDialog();
  const deleteMutation = useDeleteLocation();
  const { data: childrenResponse, isLoading: isChildrenLoading } = useLocationChildrenTable(location.id);
  const canAddChild = location.locationRole === 'ZONE';
  const RoleIcon = LOCATION_ROLE_ICON[location.locationRole];

  const columns = useMemo<ColumnDef<LocationData>[]>(
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
        cell: ({ row }) => LocationRoleLabels[row.original.locationRole],
      },
      {
        accessorKey: 'isActive',
        header: 'Status',
        cell: ({ row }) => (
          <Badge variant={row.original.isActive ? 'success' : 'destructive'}>
            {row.original.isActive ? 'Active' : 'Inactive'}
          </Badge>
        ),
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
                onClick: () => onSelectLocation(row.original.id),
              },
            ]}
          />
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
    slug: `location-${location.id}-children`,
    label: 'child location',
    enableRowSelection: false,
    onStatePush: () => {
      queryClient.invalidateQueries({ queryKey: LOCATION_CHILDREN_TABLE_KEY(location.id) });
    },
  });

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
          <Badge variant={location.isActive ? 'success' : 'destructive'}>
            {location.isActive ? 'Active' : 'Inactive'}
          </Badge>
          <Badge variant="outline">{LocationRoleLabels[location.locationRole]}</Badge>
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
            variant="destructive"
            size="sm"
            onClick={handleDelete}
            disabled={!location.canDelete || deleteMutation.isPending}
            isLoading={deleteMutation.isPending}
            startAdornment={<Trash2 className="size-3.5" />}
          >
            Delete
          </Button>
        </div>
      </div>

      <div className="flex flex-nowrap items-start gap-2 overflow-x-auto">
        <DetailSection wrap>
          <DetailField className="px-4 py-2" label="Sort Order" type="number" value={location.sortOrder} />
          <DetailField
            className="px-4 py-2"
            label="Role"
            type="string"
            value={
              <span className="flex items-center gap-1.5">
                <RoleIcon className="size-4 text-muted-foreground" />
                {LocationRoleLabels[location.locationRole]}
              </span>
            }
          />
          <DetailField
            className="px-4 py-2"
            label="Child Locations"
            type="number"
            value={childrenResponse?.count ?? 0}
          />
          <DetailField className="px-4 py-2" label="Parent" type="string" value={location.parentName} />
          <DetailField className="px-4 py-2" label="Area" type="string" value={location.area} />
        </DetailSection>
      </div>

      {location.locationRole === 'ZONE' ? (
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
      ) : (
        <LocationItemsSection locationId={location.id} />
      )}

      <Dialog
        handle={addChildDialog}
        icon={MapPin}
        title="Add Child Location"
        description={`Add a child location under "${location.name}".`}
        className="max-w-3xl"
        content={(close) => (
          <AddLocationDialog
            defaultParentId={location.id}
            onSuccess={() => {
              queryClient.invalidateQueries({ queryKey: LOCATION_CHILDREN_TABLE_KEY(location.id) });
              close();
            }}
            onCancel={close}
          />
        )}
      />

      <Dialog
        handle={editDialog}
        icon={MapPin}
        title="Edit Location"
        description="Update the details for this location."
        className="max-w-3xl"
        content={(close) => <EditLocationDialog location={location} onSuccess={close} onCancel={close} />}
      />
    </div>
  );
};

interface LocationItemsSectionProps {
  locationId: string;
}

const LocationItemsSection: React.FC<LocationItemsSectionProps> = ({ locationId }) => {
  const queryClient = useQueryClient();
  const fmt = useFormatters();
  const { data: itemsResponse, isLoading } = useLocationItemsTable(locationId);

  const columns = useMemo<ColumnDef<LocationItemRow>[]>(
    () => [
      {
        accessorKey: 'itemName',
        header: 'Item',
        cell: ({ row }) => (
          <div className="flex flex-col">
            <span>{row.original.itemName}</span>
            <span className="text-xs text-muted-foreground font-mono">{row.original.itemCode}</span>
          </div>
        ),
      },
      {
        accessorKey: 'uomSymbol',
        header: 'UoM',
        cell: ({ row }) => row.original.uomSymbol ?? '—',
      },
      {
        accessorKey: 'totalQuantity',
        header: 'Quantity',
        cell: ({ row }) => <NumberCell value={row.original.totalQuantity} />,
      },
      {
        accessorKey: 'availableQuantity',
        header: 'Available',
        cell: ({ row }) => <NumberCell value={row.original.availableQuantity} />,
      },
      {
        accessorKey: 'totalValue',
        header: 'Value',
        cell: ({ row }) => (row.original.totalValue ? fmt.currency(row.original.totalValue).primary : '—'),
      },
      {
        id: 'actions',
        header: '',
        cell: ({ row }) => {
          const actions: RowAction[] = [
            {
              id: 'view',
              icon: Eye,
              label: 'View',
              dialog: {
                title: row.original.itemName,
                description: 'Stock batches and landed cost.',
                className: 'max-w-3xl',
                content: () => (
                  <LocationItemQuantsDialogContent locationId={locationId} itemId={row.original.inventoryItemId} />
                ),
              },
            },
          ];
          return <RowActions actions={actions} />;
        },
        enableSorting: false,
        enableHiding: false,
      },
    ],
    [fmt, locationId],
  );

  const { table } = useDataTable({
    columns,
    serverState: itemsResponse,
    slug: `location-${locationId}-items`,
    label: 'item',
    enableRowSelection: false,
    onStatePush: () => {
      queryClient.invalidateQueries({ queryKey: LOCATION_ITEMS_TABLE_KEY(locationId) });
    },
  });

  return (
    <div>
      <Typography variant="overline" intent="muted" className="mb-3">
        Items ({itemsResponse?.count ?? 0})
      </Typography>
      <DataTable
        table={table}
        mode="compact"
        isLoading={isLoading}
        emptyStateConfig={{
          icon: Boxes,
          title: 'No stock in this location',
          description: 'This location currently holds no inventory.',
        }}
      />
    </div>
  );
};
