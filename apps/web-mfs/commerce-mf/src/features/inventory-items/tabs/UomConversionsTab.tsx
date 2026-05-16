import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@vritti/quantum-ui/Button';
import { type ColumnDef, DataTable, RowActions, useDataTable } from '@vritti/quantum-ui/DataTable';
import { Dialog } from '@vritti/quantum-ui/Dialog';
import { useConfirm, useDialog } from '@vritti/quantum-ui/hooks';
import { ArrowLeftRight, Pencil, Plus, Trash2 } from 'lucide-react';
import type React from 'react';
import { useCallback, useMemo } from 'react';
import {
  INVENTORY_ITEM_UOM_CONVERSIONS_KEY,
  useDeleteInventoryItemUomConversion,
  useInventoryItemUomConversionsTable,
} from '@/hooks/inventory-items';
import type { InventoryItemUomConversionData } from '@/schemas/inventory-item-uom-conversions';
import { AddUomConversionForm } from '../forms/AddUomConversionForm';
import { EditUomConversionForm } from '../forms/EditUomConversionForm';

interface UomConversionsTabProps {
  itemId: string;
  itemUomId: string;
  itemUomSymbol: string;
}

export const UomConversionsTab: React.FC<UomConversionsTabProps> = ({ itemId, itemUomId, itemUomSymbol }) => {
  const queryClient = useQueryClient();
  const confirm = useConfirm();
  const addDialog = useDialog();
  const { data: response, isLoading } = useInventoryItemUomConversionsTable(itemId);
  const deleteMutation = useDeleteInventoryItemUomConversion(itemId);

  const handleDelete = useCallback(
    async (row: InventoryItemUomConversionData) => {
      const confirmed = await confirm({
        title: 'Remove conversion?',
        description: `Remove the UOM conversion for "${row.uomName} (${row.uomSymbol})"?`,
        confirmLabel: 'Remove',
        variant: 'destructive',
      });
      if (confirmed) deleteMutation.mutate(row.id);
    },
    [confirm, deleteMutation],
  );

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
            {row.original.numerator} {row.original.uomSymbol} = {row.original.denominator} {itemUomSymbol}
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
                disabled: !row.original.canEdit,
                dialog: {
                  title: 'Edit UOM Conversion',
                  description: `Update the conversion ratio for ${row.original.uomName} (${row.original.uomSymbol}).`,
                  content: (close) => (
                    <EditUomConversionForm
                      itemId={itemId}
                      conversionId={row.original.id}
                      uomSymbol={row.original.uomSymbol}
                      itemUomSymbol={itemUomSymbol}
                      currentNumerator={row.original.numerator}
                      currentDenominator={row.original.denominator}
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
                disabled: !row.original.canDelete,
                onClick: () => handleDelete(row.original),
              },
            ]}
          />
        ),
        enableSorting: false,
        enableHiding: false,
      },
    ],
    [itemId, handleDelete, itemUomSymbol],
  );

  const { table } = useDataTable({
    columns,
    serverState: response,
    slug: `inventory-item-${itemId}-uom-conversions`,
    label: 'conversion',
    enableRowSelection: false,
    enableSorting: true,
    onStatePush: () => queryClient.invalidateQueries({ queryKey: [...INVENTORY_ITEM_UOM_CONVERSIONS_KEY(itemId)] }),
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
            <Button startAdornment={<Plus className="size-4" />} onClick={addDialog.open}>
              Add Conversion
            </Button>
          ),
        }}
      />

      <Dialog
        handle={addDialog}
        title="Add UOM Conversion"
        description="Specify a conversion factor for this inventory item."
        content={(close) => (
          <AddUomConversionForm
            itemId={itemId}
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
