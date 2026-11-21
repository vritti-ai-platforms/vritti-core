import { useQueryClient } from '@tanstack/react-query';
import { ORG_INVENTORY_ITEMS } from '@vritti/commerce-permissions/inventory-items';
import { Button } from '@vritti/quantum-ui/Button';
import { type ColumnDef, DataTable, NumberCell, RowActions, useDataTable } from '@vritti/quantum-ui/DataTable';
import { Dialog } from '@vritti/quantum-ui/Dialog';
import { useDialog } from '@vritti/quantum-ui/hooks';
import { ArrowLeftRight, Package, Pencil, Plus, Trash2 } from 'lucide-react';
import type React from 'react';
import { useMemo } from 'react';
import { DimensionsText, MeasureText } from '@/components/storage/MeasureText';
import {
  ORG_INVENTORY_ITEM_UOM_CONVERSIONS_KEY,
  useDeleteInventoryItemUomConversion,
  useInventoryItemUomConversionsTable,
} from '@/hooks/organization/inventory-items';
import type { InventoryItemUomConversionData } from '@/schemas/inventory-item-uom-conversions';
import { MeasureValues } from '@/schemas/measures';
import { AddUomConversionForm } from './forms/AddUomConversionForm';
import { EditUomConversionForm } from './forms/EditUomConversionForm';

interface UomConversionsTabProps {
  inventoryItemId: string;
  itemUomId: string;
  itemUomSymbol: string;
}

export const UomConversionsTab: React.FC<UomConversionsTabProps> = ({ inventoryItemId, itemUomId, itemUomSymbol }) => {
  const queryClient = useQueryClient();
  const addDialog = useDialog();
  const inventoryItemUomConversionsTableQuery = useInventoryItemUomConversionsTable(inventoryItemId);
  const deleteMutation = useDeleteInventoryItemUomConversion(inventoryItemId);

  const columns = useMemo<ColumnDef<InventoryItemUomConversionData>[]>(
    () => [
      {
        accessorKey: 'uomName',
        header: 'UOM',
        cell: ({ row }) => `${row.original.uomName} (${row.original.uomSymbol})`,
        enableSorting: true,
      },
      {
        id: 'conversion',
        header: 'Conversion',
        cell: ({ row }) => (
          <span className="font-mono">
            <NumberCell value={row.original.uomQty} /> {row.original.uomSymbol} ={' '}
            <NumberCell value={row.original.primaryUomQty} /> {itemUomSymbol}
          </span>
        ),
      },
      {
        id: 'packWeight',
        header: 'Weight',
        cell: ({ row }) => <MeasureText value={row.original.weight} measure={MeasureValues.WEIGHT} inBaseUnits />,
      },
      {
        id: 'packVolume',
        header: 'Volume',
        cell: ({ row }) => <MeasureText value={row.original.volume} measure={MeasureValues.VOLUME} inBaseUnits />,
      },
      {
        id: 'packDimensions',
        header: 'L × W × H',
        cell: ({ row }) => (
          <DimensionsText
            length={row.original.length}
            width={row.original.width}
            height={row.original.height}
            inBaseUnits
          />
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
                permission: ORG_INVENTORY_ITEMS.conversions.edit,
                dialog: {
                  title: 'Edit UOM Conversion',
                  description: `Update the conversion ratio and pack figures for ${row.original.uomName} (${row.original.uomSymbol}).`,
                  content: (close) => (
                    <EditUomConversionForm
                      inventoryItemId={inventoryItemId}
                      conversion={row.original}
                      itemUomSymbol={itemUomSymbol}
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
                permission: ORG_INVENTORY_ITEMS.conversions.delete,
                variant: 'destructive',
                disabled: !row.original.canDelete,
                disabledTip: row.original.isDisplayUnit
                  ? "It is the item's display unit — change that first."
                  : 'A supplier item is priced in this unit.',
                confirm: {
                  title: 'Remove conversion?',
                  description: `Remove the UOM conversion for "${row.original.uomName} (${row.original.uomSymbol})"?`,
                  confirmLabel: 'Remove',
                  variant: 'destructive',
                },
                onClick: () => deleteMutation.mutate(row.original.id),
              },
            ]}
          />
        ),
        enableSorting: false,
        enableHiding: false,
      },
    ],
    [inventoryItemId, itemUomSymbol, deleteMutation.mutate],
  );

  const inventoryItemUomConversionsTable = useDataTable({
    columns,
    query: inventoryItemUomConversionsTableQuery,
    slug: `org-inventory-item-${inventoryItemId}-uom-conversions`,
    label: 'conversion',
    enableRowSelection: false,
    enableSorting: true,
    onStatePush: () =>
      queryClient.invalidateQueries({ queryKey: [...ORG_INVENTORY_ITEM_UOM_CONVERSIONS_KEY(inventoryItemId)] }),
  });

  return (
    <>
      <DataTable
        table={inventoryItemUomConversionsTable}
        mode="tab"
        permission={ORG_INVENTORY_ITEMS.conversions.view}
        toolbarActions={{
          actions: (
            <Button
              size="sm"
              startAdornment={<Plus className="size-4" />}
              onClick={addDialog.open}
              permission={ORG_INVENTORY_ITEMS.conversions.add}
            >
              Add Conversion
            </Button>
          ),
        }}
        emptyStateConfig={{
          icon: ArrowLeftRight,
          title: 'No UOM conversions',
          description:
            'No per-item UOM conversions defined. Add one to specify how an alternative UOM relates to this item.',
          action: (
            <Button
              startAdornment={<Plus className="size-4" />}
              onClick={addDialog.open}
              permission={ORG_INVENTORY_ITEMS.conversions.add}
            >
              Add Conversion
            </Button>
          ),
        }}
      />

      <Dialog
        handle={addDialog}
        icon={Package}
        title="Add UOM Conversion"
        description="Specify a conversion factor for this inventory item."
        content={(close) => (
          <AddUomConversionForm
            inventoryItemId={inventoryItemId}
            itemUomId={itemUomId}
            itemUomSymbol={itemUomSymbol}
            onSuccess={close}
            onCancel={close}
          />
        )}
      />
    </>
  );
};
