import { useQueryClient } from '@tanstack/react-query';
import { ORG_STORAGE_TYPES } from '@vritti/commerce-permissions/storage-types';
import { Badge } from '@vritti/quantum-ui/Badge';
import { Button } from '@vritti/quantum-ui/Button';
import {
  type ColumnDef,
  DataTable,
  NumberCell,
  type RowAction,
  RowActions,
  StringCell,
  useDataTable,
} from '@vritti/quantum-ui/DataTable';
import { Dialog } from '@vritti/quantum-ui/Dialog';
import { useDialog } from '@vritti/quantum-ui/hooks';
import { PageHeader } from '@vritti/quantum-ui/PageHeader';
import { pluralize } from '@vritti/quantum-ui/pluralize';
import { SelectFilter } from '@vritti/quantum-ui/Select';
import { Pencil, Plus, Trash2, Warehouse } from 'lucide-react';
import { useMemo } from 'react';
import { DimensionsText, MeasureText } from '@/components/storage/MeasureText';
import {
  STORAGE_TYPES_TABLE_KEY,
  useDeleteStorageType,
  useStorageTypesTable,
} from '@/hooks/organization/storage-types';
import { MeasureValues } from '@/schemas/measures';
import {
  STORAGE_CAPACITY_CHECK_LABELS,
  STORAGE_CAPACITY_CHECK_OPTIONS,
  StorageCapacityCheckValues,
  type StorageTypeData,
} from '@/schemas/storage-types';
import { AddStorageTypeDialog } from './forms/AddStorageTypeDialog';
import { EditStorageTypeDialog } from './forms/EditStorageTypeDialog';

const CAPACITY_CHECK_BADGE_VARIANT = {
  [StorageCapacityCheckValues.NONE]: 'outline',
  [StorageCapacityCheckValues.WARN]: 'warning',
  [StorageCapacityCheckValues.BLOCK]: 'secondary',
} as const;

const STATUS_OPTIONS = [
  { value: 'true', label: 'Active' },
  { value: 'false', label: 'Inactive' },
];

// Names what still uses a storage type, for the delete action's disabled tip
function usageText(storageType: StorageTypeData): string {
  const parts = [
    storageType.locationCount > 0 ? pluralize('location', storageType.locationCount, true) : null,
    storageType.itemCount > 0 ? pluralize('item', storageType.itemCount, true) : null,
  ].filter(Boolean);
  return `Used by ${parts.join(' and ')}. Move them to another storage type first.`;
}

export const StorageTypesPage = () => {
  const queryClient = useQueryClient();
  const storageTypesTableQuery = useStorageTypesTable();
  const addDialog = useDialog();
  const deleteMutation = useDeleteStorageType();

  const columns = useMemo<ColumnDef<StorageTypeData>[]>(
    () => [
      {
        accessorKey: 'code',
        header: 'Code',
        cell: ({ row }) => <StringCell value={row.original.code} mono />,
        enableSorting: true,
      },
      { accessorKey: 'name', header: 'Name', enableSorting: true },
      {
        accessorKey: 'maxWeight',
        header: 'Max Weight',
        cell: ({ row }) => <MeasureText value={row.original.maxWeight} measure={MeasureValues.WEIGHT} />,
        enableSorting: true,
      },
      {
        accessorKey: 'maxVolume',
        header: 'Max Volume',
        cell: ({ row }) => <MeasureText value={row.original.maxVolume} measure={MeasureValues.VOLUME} />,
        enableSorting: true,
      },
      {
        id: 'dimensions',
        header: 'Inside L × W × H',
        cell: ({ row }) => (
          <DimensionsText length={row.original.length} width={row.original.width} height={row.original.height} />
        ),
      },
      {
        accessorKey: 'capacityCheck',
        header: 'Capacity Check',
        cell: ({ row }) => (
          <Badge variant={CAPACITY_CHECK_BADGE_VARIANT[row.original.capacityCheck]}>
            {STORAGE_CAPACITY_CHECK_LABELS[row.original.capacityCheck]}
          </Badge>
        ),
        enableSorting: true,
      },
      {
        id: 'mixing',
        header: 'Mixing',
        cell: ({ row }) => (
          <span className="inline-flex flex-wrap items-center gap-1">
            <Badge variant="outline">{row.original.allowMixedItems ? 'Mixed items' : 'One item'}</Badge>
            <Badge variant="outline">{row.original.allowMixedBatches ? 'Mixed batches' : 'One batch'}</Badge>
            <Badge variant="outline">{row.original.allowAdditionToStock ? 'Adds to stock' : 'No additions'}</Badge>
          </span>
        ),
      },
      {
        accessorKey: 'locationCount',
        header: 'Locations',
        cell: ({ row }) => <NumberCell value={row.original.locationCount} />,
        enableSorting: false,
      },
      {
        accessorKey: 'itemCount',
        header: 'Items',
        cell: ({ row }) => <NumberCell value={row.original.itemCount} />,
        enableSorting: false,
      },
      {
        accessorKey: 'isActive',
        header: 'Status',
        cell: ({ row }) =>
          row.original.isActive ? <Badge variant="success">Active</Badge> : <Badge variant="outline">Inactive</Badge>,
        enableSorting: true,
      },
      {
        id: 'actions',
        header: '',
        cell: ({ row }) => {
          const storageType = row.original;
          const inUse = storageType.locationCount > 0 || storageType.itemCount > 0;
          const actions: RowAction[] = [
            {
              id: 'edit',
              icon: Pencil,
              label: 'Edit',
              permission: ORG_STORAGE_TYPES.edit,
              dialog: {
                title: 'Edit Storage Type',
                description: 'Update the limits and putaway rules. The code is fixed.',
                className: 'max-w-3xl',
                content: (close) => (
                  <EditStorageTypeDialog storageType={storageType} onSuccess={close} onCancel={close} />
                ),
              },
            },
            {
              id: 'delete',
              icon: Trash2,
              label: 'Delete',
              variant: 'destructive',
              permission: ORG_STORAGE_TYPES.delete,
              disabled: inUse,
              disabledTip: usageText(storageType),
              confirm: {
                title: `Delete "${storageType.name}"?`,
                description: `The storage type ${storageType.name} will be permanently removed. This action cannot be undone.`,
                confirmLabel: 'Delete',
                variant: 'destructive',
              },
              onClick: () => deleteMutation.mutate(storageType.id),
            },
          ];
          return <RowActions actions={actions} />;
        },
        enableSorting: false,
        enableHiding: false,
      },
    ],
    [deleteMutation.mutate],
  );

  const storageTypesTable = useDataTable({
    columns,
    slug: 'commerce-org-storage-types',
    label: 'storage type',
    query: storageTypesTableQuery,
    enableRowSelection: false,
    enableSorting: true,
    enableMultiSort: false,
    onStatePush: () => queryClient.invalidateQueries({ queryKey: STORAGE_TYPES_TABLE_KEY }),
  });

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Storage Types"
        description="The physical kinds of place stock is kept in — their limits, and what may share a location."
      />

      <DataTable
        table={storageTypesTable}
        permission={ORG_STORAGE_TYPES.view}
        filters={[
          <SelectFilter
            key="capacityCheck"
            name="capacityCheck"
            label="Capacity Check"
            options={STORAGE_CAPACITY_CHECK_OPTIONS}
            multiple
          />,
          <SelectFilter key="isActive" name="isActive" label="Status" options={STATUS_OPTIONS} />,
        ]}
        searchConfig={{
          columns: [
            { id: 'name', label: 'Name' },
            { id: 'code', label: 'Code' },
          ],
          searchAll: true,
        }}
        toolbarActions={{
          actions: (
            <Button
              size="sm"
              startAdornment={<Plus className="size-4" />}
              onClick={addDialog.open}
              permission={ORG_STORAGE_TYPES.add}
            >
              Add Storage Type
            </Button>
          ),
        }}
        emptyStateConfig={{
          icon: Warehouse,
          title: 'No storage types',
          description: 'Add a storage type, such as a shelf, pallet rack or fridge, to give locations their limits.',
          action: (
            <Button
              startAdornment={<Plus className="size-4" />}
              onClick={addDialog.open}
              permission={ORG_STORAGE_TYPES.add}
            >
              Add Storage Type
            </Button>
          ),
        }}
      />

      <Dialog
        handle={addDialog}
        icon={Warehouse}
        title="Add Storage Type"
        description="Limits are entered in kg, L and cm. Capacity is always 100 per location."
        className="max-w-3xl"
        content={(close) => <AddStorageTypeDialog onSuccess={close} onCancel={close} />}
      />
    </div>
  );
};
