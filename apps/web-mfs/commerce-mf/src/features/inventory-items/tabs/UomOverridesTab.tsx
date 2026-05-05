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
import { AddUomOverrideForm } from '../forms/AddUomOverrideForm';
import { EditUomOverrideForm } from '../forms/EditUomOverrideForm';

interface UomOverridesTabProps {
  itemId: string;
}

export const UomOverridesTab: React.FC<UomOverridesTabProps> = ({ itemId }) => {
  const queryClient = useQueryClient();
  const confirm = useConfirm();
  const addDialog = useDialog();
  const { data: response, isLoading } = useInventoryItemUomConversionsTable(itemId);
  const deleteMutation = useDeleteInventoryItemUomConversion(itemId);

  const handleDelete = useCallback(
    async (row: InventoryItemUomConversionData) => {
      const confirmed = await confirm({
        title: 'Remove override?',
        description: `Remove the UOM override for "${row.uomName} (${row.uomSymbol})"?`,
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
        id: 'base',
        header: 'Base',
        cell: ({ row }) => <span className="font-mono">{row.original.baseUomSymbol ?? '—'}</span>,
      },
      {
        id: 'default',
        header: 'Default',
        cell: ({ row }) => (
          <span className="font-mono">
            1 {row.original.uomSymbol} = {row.original.defaultConversionFactor} {row.original.baseUomSymbol ?? ''}
          </span>
        ),
      },
      {
        id: 'override',
        header: 'Override',
        cell: ({ row }) => {
          const differs = row.original.conversionFactor !== row.original.defaultConversionFactor;
          return (
            <span className={differs ? 'font-mono font-semibold text-warning' : 'font-mono'}>
              1 {row.original.uomSymbol} = {row.original.conversionFactor} {row.original.baseUomSymbol ?? ''}
            </span>
          );
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
                disabled: !row.original.canEdit,
                dialog: {
                  title: 'Edit UOM Override',
                  description: `Update the conversion factor for ${row.original.uomName} (${row.original.uomSymbol}).`,
                  content: (close) => (
                    <EditUomOverrideForm
                      itemId={itemId}
                      conversionId={row.original.id}
                      uomSymbol={row.original.uomSymbol}
                      baseUomSymbol={row.original.baseUomSymbol}
                      currentFactor={row.original.conversionFactor}
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
    [itemId, handleDelete],
  );

  const { table } = useDataTable({
    columns,
    serverState: response,
    slug: `inventory-item-${itemId}-uom-overrides`,
    label: 'override',
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
              Add Override
            </Button>
          ),
        }}
        emptyStateConfig={{
          icon: ArrowLeftRight,
          title: 'No UOM overrides',
          description: 'This item uses BU-wide UOM defaults. Add an override to specify a custom conversion.',
          action: (
            <Button startAdornment={<Plus className="size-4" />} onClick={addDialog.open}>
              Add Override
            </Button>
          ),
        }}
      />

      <Dialog
        handle={addDialog}
        title="Add UOM Override"
        description="Specify a custom conversion factor for this inventory item."
        content={(close) => <AddUomOverrideForm itemId={itemId} onSuccess={close} onCancel={close} />}
      />
    </>
  );
};
