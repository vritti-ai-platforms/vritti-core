import { ORG_INVENTORY_ITEMS } from '@vritti/commerce-permissions/inventory-items';
import { Button } from '@vritti/quantum-ui/Button';
import {
  type ColumnDef,
  CurrencyCell,
  DataTable,
  DateTimeCell,
  RowActions,
  useDataTable,
} from '@vritti/quantum-ui/DataTable';
import { Dialog } from '@vritti/quantum-ui/Dialog';
import { useConfirm, useDialog } from '@vritti/quantum-ui/hooks';
import { Pencil, Plus, Tag, Trash2 } from 'lucide-react';
import type React from 'react';
import { useCallback, useMemo } from 'react';
import { useDeleteInventoryItemMrp, useInventoryItemMrp } from '@/hooks/organization/inventory-items';
import type { InventoryItemMrpData } from '@/schemas/inventory-item-mrp';
import { AddMrpForm } from '../forms/AddMrpForm';
import { EditMrpForm } from '../forms/EditMrpForm';

interface MrpTabProps {
  inventoryItemId: string;
}

export const MrpTab: React.FC<MrpTabProps> = ({ inventoryItemId }) => {
  const confirm = useConfirm();
  const addDialog = useDialog();
  const { data: rows = [], isLoading } = useInventoryItemMrp(inventoryItemId);
  const deleteMutation = useDeleteInventoryItemMrp(inventoryItemId);

  const handleDelete = useCallback(
    async (row: InventoryItemMrpData) => {
      const confirmed = await confirm({
        title: 'Remove MRP?',
        description: `Remove the ${row.amount.currency} MRP for ${row.uomSymbol ?? 'this unit'}?`,
        confirmLabel: 'Remove',
        variant: 'destructive',
      });
      if (confirmed) deleteMutation.mutate(row.id);
    },
    [confirm, deleteMutation],
  );

  const columns = useMemo<ColumnDef<InventoryItemMrpData>[]>(
    () => [
      {
        accessorKey: 'uomSymbol',
        header: 'Unit',
        cell: ({ row }) => row.original.uomSymbol ?? '—',
      },
      {
        accessorKey: 'amount',
        header: 'Currency',
        cell: ({ row }) => row.original.amount.currency,
      },
      {
        id: 'value',
        header: 'MRP',
        cell: ({ row }) => <CurrencyCell value={row.original.amount} />,
      },
      {
        accessorKey: 'sourcedAt',
        header: 'Sourced',
        cell: ({ row }) =>
          row.original.sourcedAt ? (
            <DateTimeCell value={row.original.sourcedAt} />
          ) : (
            <span className="text-xs text-muted-foreground">Manual</span>
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
                permission: ORG_INVENTORY_ITEMS.mrp.edit,
                dialog: {
                  title: 'Edit MRP',
                  description: `Update the ${row.original.amount.currency} MRP for this item.`,
                  content: (close) => (
                    <EditMrpForm
                      inventoryItemId={inventoryItemId}
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
                label: 'Delete',
                permission: ORG_INVENTORY_ITEMS.mrp.delete,
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
    [inventoryItemId, handleDelete],
  );

  const serverState = useMemo(() => ({ result: rows, count: rows.length }), [rows]);

  const { table } = useDataTable({
    columns,
    serverState,
    slug: `org-inventory-item-${inventoryItemId}-mrp`,
    label: 'MRP',
    enableRowSelection: false,
    enableSorting: false,
  });

  return (
    <>
      <DataTable
        table={table}
        mode="tab"
        isLoading={isLoading}
        permission={ORG_INVENTORY_ITEMS.mrp.view}
        toolbarActions={{
          actions: (
            <Button
              size="sm"
              startAdornment={<Plus className="size-4" />}
              onClick={addDialog.open}
              permission={ORG_INVENTORY_ITEMS.mrp.add}
            >
              Add MRP
            </Button>
          ),
        }}
        emptyStateConfig={{
          icon: Tag,
          title: 'No MRP set',
          description: 'Set a maximum retail price per unit and currency for this item.',
          action: (
            <Button
              startAdornment={<Plus className="size-4" />}
              onClick={addDialog.open}
              permission={ORG_INVENTORY_ITEMS.mrp.add}
            >
              Add MRP
            </Button>
          ),
        }}
      />

      <Dialog
        handle={addDialog}
        icon={Tag}
        title="Add MRP"
        description="Set the maximum retail price for a unit and currency."
        content={(close) => <AddMrpForm inventoryItemId={inventoryItemId} onSuccess={close} onCancel={close} />}
      />
    </>
  );
};
