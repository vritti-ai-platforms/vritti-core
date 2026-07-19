import { useQueryClient } from '@tanstack/react-query';
import { LE_SUPPLIERS } from '@vritti/commerce-permissions/suppliers';
import { Badge } from '@vritti/quantum-ui/Badge';
import { Button } from '@vritti/quantum-ui/Button';
import {
  type ColumnDef,
  CurrencyCell,
  DataTable,
  getSelectionColumn,
  NumberCell,
  RowActions,
  StringCell,
  useDataTable,
} from '@vritti/quantum-ui/DataTable';
import { Dialog } from '@vritti/quantum-ui/Dialog';
import { useConfirm, useDialog } from '@vritti/quantum-ui/hooks';
import { buildSlug } from '@vritti/quantum-ui/slug';
import { ClipboardList, Gift, Pencil, Plus, Star, Trash2, Truck } from 'lucide-react';
import { useCallback, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  SUPPLIER_ITEMS_TABLE_KEY,
  useBulkSetSupplierItemPreferred,
  useBulkUnlinkSupplierItems,
  useSupplierItemsTable,
  useUnlinkSupplierItem,
} from '@/hooks/legal-entity/suppliers';
import type { SupplierItemData } from '@/schemas/suppliers';
import { AddSupplierItemDialog } from '../forms/AddSupplierItemDialog';
import { SetSupplierItemSchemeDialog } from '../forms/SetSupplierItemSchemeDialog';
import { UpdateSupplierItemDialog } from '../forms/UpdateSupplierItemDialog';

interface ItemsTabProps {
  supplierId: string;
  supplierCurrencyCode?: string;
}

export const ItemsTab = ({ supplierId, supplierCurrencyCode }: ItemsTabProps) => {
  const queryClient = useQueryClient();
  const addItemDialog = useDialog();
  const setSchemeDialog = useDialog();
  const [schemeTargetIds, setSchemeTargetIds] = useState<string[]>([]);
  const confirm = useConfirm();
  const unlinkMutation = useUnlinkSupplierItem(supplierId);
  const bulkUnlinkMutation = useBulkUnlinkSupplierItems(supplierId);
  const bulkSetPreferredMutation = useBulkSetSupplierItemPreferred(supplierId);
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

  const handleSetPreferred = useCallback(
    async (ids: string[], onDone: () => void) => {
      const confirmed = await confirm({
        title: `Set ${ids.length} item${ids.length === 1 ? '' : 's'} as preferred?`,
        description:
          'This supplier becomes the preferred source for the selected inventory items, replacing any other preferred supplier.',
        confirmLabel: 'Set Preferred',
      });
      if (confirmed) {
        bulkSetPreferredMutation.mutate({ supplierItemIds: ids, isPreferred: true }, { onSuccess: onDone });
      }
    },
    [confirm, bulkSetPreferredMutation],
  );

  const linkedItemColumns = useMemo<ColumnDef<SupplierItemData>[]>(
    () => [
      getSelectionColumn<SupplierItemData>(),
      {
        accessorKey: 'inventoryItemName',
        header: 'Inventory Item',
        cell: ({ row }) => (
          <Link
            to={`items/${buildSlug(row.original.inventoryItemName, row.original.id)}`}
            className="font-medium text-primary hover:underline"
          >
            {row.original.inventoryItemName}
          </Link>
        ),
      },
      {
        accessorKey: 'supplierItemCode',
        header: 'Supplier Item Code',
        cell: ({ row }) => <StringCell value={row.original.supplierItemCode} />,
      },
      {
        accessorKey: 'uomSymbol',
        header: 'UOM',
        cell: ({ row }) => row.original.uomSymbol,
      },
      {
        accessorKey: 'unitPrice',
        header: 'Unit Price',
        cell: ({ row }) => <CurrencyCell value={row.original.unitPrice} />,
      },
      {
        accessorKey: 'minOrderQuantity',
        header: 'Min Order',
        cell: ({ row }) =>
          row.original.minOrderQuantity != null ? <NumberCell value={row.original.minOrderQuantity} /> : '—',
      },
      {
        accessorKey: 'isPreferred',
        header: 'Preferred',
        cell: ({ row }) => (row.original.isPreferred ? <Badge variant="success">Yes</Badge> : '—'),
      },
      {
        accessorKey: 'hasScheme',
        header: 'Scheme',
        cell: ({ row }) => {
          const { hasScheme, schemeBuyQty, schemeFreeQty } = row.original;
          if (!hasScheme || !schemeBuyQty || !schemeFreeQty) return 'None';
          return (
            <span className="font-mono">
              {schemeBuyQty}+{schemeFreeQty}
            </span>
          );
        },
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
                permission: LE_SUPPLIERS.items.edit,
                dialog: {
                  title: 'Edit Supplier Item',
                  description: 'Update pricing, UOM, and terms for this linked item.',
                  className: 'max-w-3xl',
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
                permission: LE_SUPPLIERS.items.delete,
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
    enableRowSelection: true,
    onStatePush: () => queryClient.invalidateQueries({ queryKey: SUPPLIER_ITEMS_TABLE_KEY(supplierId) }),
  });

  return (
    <>
      <DataTable
        table={linkedItemsTable}
        isLoading={isLoading}
        permission={LE_SUPPLIERS.items.view}
        selectActions={(rows) => (
          <>
            <Button
              size="sm"
              variant="outline"
              permission={LE_SUPPLIERS.items.edit}
              startAdornment={<Star className="size-4" />}
              isLoading={bulkSetPreferredMutation.isPending}
              onClick={() =>
                handleSetPreferred(
                  rows.map((r) => r.original.id),
                  () => linkedItemsTable.resetRowSelection(),
                )
              }
            >
              Set Preferred
            </Button>
            <Button
              size="sm"
              variant="outline"
              permission={LE_SUPPLIERS.items.edit}
              startAdornment={<Gift className="size-4" />}
              onClick={() => {
                setSchemeTargetIds(rows.map((r) => r.original.id));
                setSchemeDialog.open();
              }}
            >
              Set Scheme
            </Button>
            <Button
              size="sm"
              variant="destructive"
              permission={LE_SUPPLIERS.items.delete}
              startAdornment={<Trash2 className="size-4" />}
              isLoading={bulkUnlinkMutation.isPending}
              onClick={() => {
                const ids = rows.map((r) => r.original.id);
                bulkUnlinkMutation.mutate(ids, {
                  onSuccess: () => linkedItemsTable.resetRowSelection(),
                });
              }}
            >
              Unlink
            </Button>
          </>
        )}
        toolbarActions={{
          actions: (
            <Button size="sm" permission={LE_SUPPLIERS.items.add} onClick={addItemDialog.open}>
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
        className="max-w-3xl"
        icon={Truck}
        title="Add Supplier Item"
        description="Associate an inventory item with this supplier."
        content={(close) => (
          <AddSupplierItemDialog
            supplierId={supplierId}
            supplierCurrencyCode={supplierCurrencyCode}
            onSuccess={close}
            onCancel={close}
          />
        )}
      />

      <Dialog
        handle={setSchemeDialog}
        icon={Truck}
        title="Set Free Goods Scheme"
        description="Apply a free-goods scheme to the selected supplier items."
        content={(close) => (
          <SetSupplierItemSchemeDialog
            supplierId={supplierId}
            supplierItemIds={schemeTargetIds}
            onSuccess={() => {
              close();
              linkedItemsTable.resetRowSelection();
            }}
            onCancel={close}
          />
        )}
      />
    </>
  );
};
