import { ORG_INVENTORY_ITEMS } from '@vritti/commerce-permissions/inventory-items';
import { Button } from '@vritti/quantum-ui/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@vritti/quantum-ui/Card';
import { type ColumnDef, DataTable, RowActions, useDataTable } from '@vritti/quantum-ui/DataTable';
import { DetailField } from '@vritti/quantum-ui/DetailField';
import { Dialog } from '@vritti/quantum-ui/Dialog';
import { useConfirm, useDialog, useFormatters } from '@vritti/quantum-ui/hooks';
import { Typography } from '@vritti/quantum-ui/Typography';
import { Pencil, Plus, Ruler, Trash2, Warehouse } from 'lucide-react';
import type React from 'react';
import { useCallback, useMemo } from 'react';
import { DimensionsText, MeasureText } from '@/components/storage/MeasureText';
import { useDeleteInventoryItemStorageType, useInventoryItemStorageTypes } from '@/hooks/organization/inventory-items';
import type { InventoryItemStorageTypeData } from '@/schemas/inventory-item-storage-types';
import type { InventoryItemData } from '@/schemas/inventory-items';
import { MeasureValues } from '@/schemas/measures';
import { AddItemStorageTypeForm } from './forms/AddItemStorageTypeForm';
import { EditItemStorageTypeForm } from './forms/EditItemStorageTypeForm';
import { EditStorageFiguresForm } from './forms/EditStorageFiguresForm';

interface StorageTabProps {
  item: InventoryItemData;
}

export const StorageTab: React.FC<StorageTabProps> = ({ item }) => {
  const editFiguresDialog = useDialog();
  const unit = item.uomSymbol ?? 'unit';

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader className="flex flex-row items-start justify-between gap-4">
          <div className="flex flex-col gap-1.5">
            <CardTitle>Per {unit}</CardTitle>
            <CardDescription>
              Weight, volume and size of one {unit}. Packs without their own figures are worked out from these.
            </CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            startAdornment={<Pencil className="size-4" />}
            onClick={editFiguresDialog.open}
            permission={ORG_INVENTORY_ITEMS.edit}
          >
            Edit
          </Button>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <DetailField
              label="Weight"
              type="string"
              value={<MeasureText value={item.weight} measure={MeasureValues.WEIGHT} inBaseUnits />}
            />
            <DetailField
              label="Volume"
              type="string"
              value={<MeasureText value={item.volume} measure={MeasureValues.VOLUME} inBaseUnits />}
            />
            <DetailField
              label="L × W × H"
              type="string"
              value={<DimensionsText length={item.length} width={item.width} height={item.height} inBaseUnits />}
            />
          </div>
        </CardContent>
      </Card>

      <AllowedStorageTypesSection item={item} />

      <Dialog
        handle={editFiguresDialog}
        icon={Ruler}
        title={`Edit Figures per ${unit}`}
        description="Weight in g, volume in ml and dimensions in mm. Leave a figure blank when it isn't known."
        content={(close) => <EditStorageFiguresForm item={item} onSuccess={close} onCancel={close} />}
      />
    </div>
  );
};

interface AllowedStorageTypesSectionProps {
  item: InventoryItemData;
}

const AllowedStorageTypesSection: React.FC<AllowedStorageTypesSectionProps> = ({ item }) => {
  const fmt = useFormatters();
  const confirm = useConfirm();
  const addDialog = useDialog();
  const { data: rows, isLoading } = useInventoryItemStorageTypes(item.id);
  const deleteMutation = useDeleteInventoryItemStorageType(item.id);

  const handleDelete = useCallback(
    async (row: InventoryItemStorageTypeData) => {
      const confirmed = await confirm({
        title: `Remove ${row.storageTypeName}?`,
        description: `${item.name} will no longer be put away in ${row.storageTypeName} locations. Stock already stored there blocks the removal.`,
        confirmLabel: 'Remove',
        variant: 'destructive',
      });
      if (confirmed) deleteMutation.mutate(row.id);
    },
    [confirm, deleteMutation, item.name],
  );

  const columns = useMemo<ColumnDef<InventoryItemStorageTypeData>[]>(
    () => [
      { accessorKey: 'storageTypeName', header: 'Storage Type' },
      {
        accessorKey: 'maxQuantity',
        header: 'Max per Location',
        cell: ({ row }) => (
          <span className="font-mono">
            {fmt.number(row.original.maxQuantity).primary} {row.original.uomSymbol}
          </span>
        ),
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
                permission: ORG_INVENTORY_ITEMS.storageTypes.edit,
                dialog: {
                  title: 'Edit Max per Location',
                  description: `How much ${item.name} fills one ${row.original.storageTypeName} location.`,
                  content: (close) => (
                    <EditItemStorageTypeForm
                      inventoryItemId={item.id}
                      row={row.original}
                      onSuccess={close}
                      onCancel={close}
                    />
                  ),
                },
              },
              {
                id: 'delete',
                icon: Trash2,
                label: 'Remove',
                variant: 'destructive',
                permission: ORG_INVENTORY_ITEMS.storageTypes.delete,
                onClick: () => handleDelete(row.original),
              },
            ]}
          />
        ),
        enableSorting: false,
        enableHiding: false,
      },
    ],
    [fmt, handleDelete, item.id, item.name],
  );

  const storageTypesTable = useDataTable({
    columns,
    slug: `commerce-org-inventory-item-${item.id}-storage-types`,
    label: 'storage type',
    query: { data: { result: rows ?? [], count: rows?.length ?? 0 }, isLoading },
    enableRowSelection: false,
  });

  return (
    <div>
      <Typography variant="overline" intent="muted" className="mb-3">
        Allowed Storage Types
      </Typography>
      <DataTable
        table={storageTypesTable}
        mode="compact"
        permission={ORG_INVENTORY_ITEMS.storageTypes.view}
        toolbarActions={{
          actions: (
            <Button
              size="sm"
              startAdornment={<Plus className="size-4" />}
              onClick={addDialog.open}
              permission={ORG_INVENTORY_ITEMS.storageTypes.add}
            >
              Add Storage Type
            </Button>
          ),
        }}
        emptyStateConfig={{
          icon: Warehouse,
          title: 'No storage types allowed',
          description: 'Allow a storage type so this item can be put away in its locations.',
          action: (
            <Button
              startAdornment={<Plus className="size-4" />}
              onClick={addDialog.open}
              permission={ORG_INVENTORY_ITEMS.storageTypes.add}
            >
              Add Storage Type
            </Button>
          ),
        }}
      />

      <Dialog
        handle={addDialog}
        icon={Warehouse}
        title="Allow Storage Type"
        description={`Let ${item.name} be put away in locations of a storage type.`}
        content={(close) => (
          <AddItemStorageTypeForm
            inventoryItemId={item.id}
            itemUomId={item.uomId}
            allowedStorageTypeIds={(rows ?? []).map((row) => row.storageTypeId)}
            onSuccess={close}
            onCancel={close}
          />
        )}
      />
    </div>
  );
};
