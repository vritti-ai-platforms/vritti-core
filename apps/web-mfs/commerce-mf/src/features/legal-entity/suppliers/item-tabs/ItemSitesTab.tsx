import { useQueryClient } from '@tanstack/react-query';
import { LE_SUPPLIERS } from '@vritti/commerce-permissions/suppliers';
import { Button } from '@vritti/quantum-ui/Button';
import {
  type ColumnDef,
  DataTable,
  NumberCell,
  RowActions,
  StringCell,
  useDataTable,
} from '@vritti/quantum-ui/DataTable';
import { Dialog } from '@vritti/quantum-ui/Dialog';
import { useConfirm, useDialog } from '@vritti/quantum-ui/hooks';
import { Building2, Pencil, Plus, Trash2 } from 'lucide-react';
import type React from 'react';
import { useCallback, useMemo } from 'react';
import {
  SUPPLIER_ITEM_SITES_TABLE_KEY,
  useDeleteSupplierItemSite,
  useSupplierItemSitesTable,
} from '@/hooks/legal-entity/suppliers';
import type { SupplierItemSiteRow } from '@/schemas/suppliers';
import { AddSupplierItemSiteDialog } from '../forms/AddSupplierItemSiteDialog';
import { EditSupplierItemSiteDialog } from '../forms/EditSupplierItemSiteDialog';

interface ItemSitesTabProps {
  supplierId: string;
  itemId: string;
  standingLeadTimeDays: number | null;
  standingMinOrderQuantity: number | null;
}

export const ItemSitesTab: React.FC<ItemSitesTabProps> = ({
  supplierId,
  itemId,
  standingLeadTimeDays,
  standingMinOrderQuantity,
}) => {
  const queryClient = useQueryClient();
  const confirm = useConfirm();
  const addDialog = useDialog();
  const { data: response, isLoading } = useSupplierItemSitesTable(supplierId, itemId);
  const deleteMutation = useDeleteSupplierItemSite(supplierId, itemId);

  const handleRemove = useCallback(
    async (row: SupplierItemSiteRow) => {
      const confirmed = await confirm({
        title: `Remove override for "${row.siteName ?? 'site'}"?`,
        description: 'This site will fall back to the item’s standing operational terms.',
        confirmLabel: 'Remove',
        variant: 'destructive',
      });
      if (confirmed) deleteMutation.mutate(row.id);
    },
    [confirm, deleteMutation],
  );

  const columns = useMemo<ColumnDef<SupplierItemSiteRow>[]>(
    () => [
      {
        accessorKey: 'siteName',
        header: 'Site',
        cell: ({ row }) => <StringCell value={row.original.siteName} />,
        enableSorting: false,
      },
      {
        accessorKey: 'siteCode',
        header: 'Code',
        cell: ({ row }) => <StringCell value={row.original.siteCode} mono />,
        enableSorting: false,
      },
      {
        accessorKey: 'leadTimeDays',
        header: 'Lead Time (days)',
        cell: ({ row }) => (row.original.leadTimeDays != null ? <NumberCell value={row.original.leadTimeDays} /> : '—'),
      },
      {
        accessorKey: 'minOrderQuantity',
        header: 'Min Order',
        cell: ({ row }) =>
          row.original.minOrderQuantity != null ? <NumberCell value={row.original.minOrderQuantity} /> : '—',
      },
      {
        id: 'actions',
        header: '',
        enableSorting: false,
        enableHiding: false,
        cell: ({ row }) => (
          <RowActions
            actions={[
              {
                id: 'edit',
                icon: Pencil,
                label: 'Edit',
                permission: LE_SUPPLIERS.items.edit,
                dialog: {
                  title: 'Edit Site Override',
                  description: 'Update the site-specific lead time and minimum order quantity.',
                  content: (close) => (
                    <EditSupplierItemSiteDialog
                      supplierId={supplierId}
                      itemId={itemId}
                      override={row.original}
                      onSuccess={close}
                      onCancel={close}
                    />
                  ),
                },
              },
              {
                id: 'remove',
                icon: Trash2,
                label: 'Remove',
                variant: 'destructive',
                permission: LE_SUPPLIERS.items.edit,
                onClick: () => handleRemove(row.original),
              },
            ]}
          />
        ),
      },
    ],
    [supplierId, itemId, handleRemove],
  );

  const { table } = useDataTable({
    columns,
    serverState: response,
    slug: `commerce-supplier-item-${itemId}-sites`,
    label: 'site override',
    enableRowSelection: false,
    enableSorting: true,
    enableMultiSort: false,
    onStatePush: () => queryClient.invalidateQueries({ queryKey: SUPPLIER_ITEM_SITES_TABLE_KEY(supplierId, itemId) }),
  });

  return (
    <>
      <DataTable
        table={table}
        mode="tab"
        isLoading={isLoading}
        permission={LE_SUPPLIERS.items.view}
        toolbarActions={{
          actions: (
            <Button
              size="sm"
              permission={LE_SUPPLIERS.items.edit}
              startAdornment={<Plus className="size-4" />}
              onClick={addDialog.open}
            >
              Add Override
            </Button>
          ),
        }}
        emptyStateConfig={{
          icon: Building2,
          title: 'No site overrides',
          description: 'Add a per-site override to change lead time or minimum order quantity at a specific site.',
          action: (
            <Button
              permission={LE_SUPPLIERS.items.edit}
              startAdornment={<Plus className="size-4" />}
              onClick={addDialog.open}
            >
              Add Override
            </Button>
          ),
        }}
      />

      <Dialog
        handle={addDialog}
        icon={Building2}
        title="Add Site Override"
        description="Override the item’s operational terms for a specific site."
        content={(close) => (
          <AddSupplierItemSiteDialog
            supplierId={supplierId}
            itemId={itemId}
            standingLeadTimeDays={standingLeadTimeDays}
            standingMinOrderQuantity={standingMinOrderQuantity}
            onSuccess={close}
            onCancel={close}
          />
        )}
      />
    </>
  );
};
