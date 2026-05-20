import { useQueryClient } from '@tanstack/react-query';
import { Badge } from '@vritti/quantum-ui/Badge';
import { Button } from '@vritti/quantum-ui/Button';
import { type ColumnDef, DataTable, RowActions, useDataTable } from '@vritti/quantum-ui/DataTable';
import { Dialog } from '@vritti/quantum-ui/Dialog';
import { useConfirm, useDialog } from '@vritti/quantum-ui/hooks';
import { ClipboardList, Pencil, Plus, Trash2 } from 'lucide-react';
import { useCallback, useMemo } from 'react';
import { SUPPLIER_ITEMS_TABLE_KEY, useSupplierItemsTable, useUnlinkSupplierItem } from '@/hooks/suppliers';
import type { SupplierItemData } from '@/schemas/suppliers';
import { AddSupplierItemDialog } from '../forms/AddSupplierItemDialog';
import { UpdateSupplierItemDialog } from '../forms/UpdateSupplierItemDialog';

interface ItemsTabProps {
  supplierId: string;
  supplierCurrencyCode?: string;
  existingInventoryItemIds: string[];
}

export const ItemsTab = ({ supplierId, supplierCurrencyCode, existingInventoryItemIds }: ItemsTabProps) => {
  const queryClient = useQueryClient();
  const addItemDialog = useDialog();
  const confirm = useConfirm();
  const unlinkMutation = useUnlinkSupplierItem(supplierId);
  const { data: response, isLoading } = useSupplierItemsTable(supplierId);

  const handleUnlinkItem = useCallback(
    async (itemId: string, itemName: string) => {
      const confirmed = await confirm({
        title: `Remove "${itemName}"?`,
        description: 'This item will be unlinked from the supplier.',
        confirmLabel: 'Remove',
        variant: 'destructive',
      });
      if (confirmed) unlinkMutation.mutate(itemId);
    },
    [confirm, unlinkMutation],
  );

  const linkedItemColumns = useMemo<ColumnDef<SupplierItemData>[]>(
    () => [
      {
        accessorKey: 'inventoryItemName',
        header: 'Inventory Item',
        cell: ({ row }) => row.original.inventoryItemName,
      },
      {
        accessorKey: 'supplierItemCode',
        header: 'Supplier Item Code',
        cell: ({ row }) => row.original.supplierItemCode ?? '—',
      },
      {
        accessorKey: 'uomSymbol',
        header: 'UOM',
        cell: ({ row }) => row.original.uomSymbol,
      },
      {
        accessorKey: 'unitPrice',
        header: 'Unit Price',
        cell: ({ row }) => `${row.original.unitPrice.currency} ${row.original.unitPrice.value}`,
      },
      {
        accessorKey: 'minOrderQuantity',
        header: 'Min Order',
        cell: ({ row }) => (row.original.minOrderQuantity != null ? row.original.minOrderQuantity : '—'),
      },
      {
        accessorKey: 'isPreferred',
        header: 'Preferred',
        cell: ({ row }) =>
          row.original.isPreferred ? (
            <Badge variant="secondary" className="bg-success/15 text-success">
              Yes
            </Badge>
          ) : (
            '—'
          ),
      },
      {
        id: 'actions',
        header: '',
        cell: ({ row }) => (
          <RowActions
            disabledAll={unlinkMutation.isPending}
            actions={[
              {
                id: 'edit',
                icon: Pencil,
                label: 'Edit',
                dialog: {
                  title: 'Edit Supplier Item',
                  description: 'Update pricing, UOM, and terms for this linked item.',
                  content: (close) => (
                    <UpdateSupplierItemDialog
                      supplierId={supplierId}
                      supplierCurrencyCode={supplierCurrencyCode}
                      item={row.original}
                      onSuccess={close}
                      onCancel={close}
                    />
                  ),
                },
              },
              {
                id: 'unlink',
                icon: Trash2,
                label: 'Unlink',
                variant: 'destructive',
                onClick: () => handleUnlinkItem(row.original.id, row.original.inventoryItemName ?? 'item'),
              },
            ]}
          />
        ),
        enableSorting: false,
        enableHiding: false,
      },
    ],
    [handleUnlinkItem, unlinkMutation.isPending, supplierId, supplierCurrencyCode],
  );

  const { table: linkedItemsTable } = useDataTable({
    columns: linkedItemColumns,
    slug: `commerce-supplier-${supplierId}-items`,
    label: 'item',
    serverState: response,
    enableRowSelection: false,
    onStatePush: () => queryClient.invalidateQueries({ queryKey: SUPPLIER_ITEMS_TABLE_KEY(supplierId) }),
  });

  return (
    <>
      <DataTable
        table={linkedItemsTable}
        isLoading={isLoading}
        toolbarActions={{
          actions: (
            <Button size="sm" onClick={addItemDialog.open}>
              <Plus className="mr-2 size-4" />
              Add Item
            </Button>
          ),
        }}
        emptyStateConfig={{
          icon: ClipboardList,
          title: 'No linked items',
          description: 'Link an inventory item to start tracking supplier-specific terms and pricing.',
        }}
      />

      <Dialog
        handle={addItemDialog}
        title="Add Inventory Item"
        description="Associate an inventory item with this supplier."
        content={(close) => (
          <AddSupplierItemDialog
            supplierId={supplierId}
            supplierCurrencyCode={supplierCurrencyCode}
            existingInventoryItemIds={existingInventoryItemIds}
            onSuccess={close}
            onCancel={close}
          />
        )}
      />
    </>
  );
};
