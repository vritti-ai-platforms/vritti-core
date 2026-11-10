import { useQueryClient } from '@tanstack/react-query';
import { LE_SUPPLIERS } from '@vritti/commerce-permissions/suppliers';
import { Badge } from '@vritti/quantum-ui/Badge';
import { Button } from '@vritti/quantum-ui/Button';
import { type ColumnDef, DataTable, RowActions, StringCell, useDataTable } from '@vritti/quantum-ui/DataTable';
import { Dialog } from '@vritti/quantum-ui/Dialog';
import { useConfirm, useDialog } from '@vritti/quantum-ui/hooks';
import { Building2, Pencil, Plus, Trash2 } from 'lucide-react';
import type React from 'react';
import { useCallback, useMemo } from 'react';
import { LeadTimeCell } from '@/components/suppliers/LeadTimeCell';
import {
  SUPPLIER_SITE_ITEMS_TABLE_KEY,
  useDeleteSupplierSiteItem,
  useSupplierSiteItemsTable,
} from '@/hooks/legal-entity/suppliers/index';
import type { SupplierSiteItemRow } from '@/schemas/suppliers';
import { AddSupplierSiteItemDialog } from './forms/AddSupplierSiteItemDialog';
import { EditSupplierSiteItemDialog } from './forms/EditSupplierSiteItemDialog';

interface SiteItemsTabProps {
  supplierId: string;
  itemId: string;
}

export const SiteItemsTab: React.FC<SiteItemsTabProps> = ({ supplierId, itemId }) => {
  const queryClient = useQueryClient();
  const confirm = useConfirm();
  const addDialog = useDialog();
  const supplierSiteItemsTableQuery = useSupplierSiteItemsTable(supplierId, itemId);
  const deleteMutation = useDeleteSupplierSiteItem(supplierId, itemId);

  const handleRemove = useCallback(
    async (row: SupplierSiteItemRow) => {
      const confirmed = await confirm({
        title: `Remove "${row.siteName ?? 'site'}"?`,
        description:
          'The site will no longer be able to order this item from this supplier. Its price history is kept.',
        confirmLabel: 'Remove',
        variant: 'destructive',
      });
      if (confirmed) deleteMutation.mutate(row.id);
    },
    [confirm, deleteMutation],
  );

  const columns = useMemo<ColumnDef<SupplierSiteItemRow>[]>(
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
        accessorKey: 'isPreferred',
        header: 'Preferred',
        cell: ({ row }) => (row.original.isPreferred ? <Badge variant="success">Preferred</Badge> : '—'),
      },
      {
        accessorKey: 'leadTimeDays',
        header: 'Lead Time (days)',
        cell: ({ row }) => (
          <LeadTimeCell days={row.original.leadTimeDays} overridden={row.original.isLeadTimeOverridden} />
        ),
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
                permission: LE_SUPPLIERS.siteItems.edit,
                dialog: {
                  title: 'Edit Site',
                  description: 'Update how this site buys the item from this supplier.',
                  content: (close) => (
                    <EditSupplierSiteItemDialog
                      supplierId={supplierId}
                      itemId={itemId}
                      supplierSiteItem={row.original}
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
                permission: LE_SUPPLIERS.siteItems.delete,
                onClick: () => handleRemove(row.original),
              },
            ]}
          />
        ),
      },
    ],
    [supplierId, itemId, handleRemove],
  );

  const supplierSiteItemsTable = useDataTable({
    columns,
    query: supplierSiteItemsTableQuery,
    slug: `commerce-le-supplier-item-${itemId}-site-items`,
    label: 'site',
    enableRowSelection: false,
    enableSorting: true,
    enableMultiSort: false,
    onStatePush: () => queryClient.invalidateQueries({ queryKey: SUPPLIER_SITE_ITEMS_TABLE_KEY(supplierId, itemId) }),
  });

  return (
    <>
      <DataTable
        table={supplierSiteItemsTable}
        mode="tab"
        permission={LE_SUPPLIERS.siteItems.view}
        toolbarActions={{
          actions: (
            <Button
              size="sm"
              permission={LE_SUPPLIERS.siteItems.add}
              startAdornment={<Plus className="size-4" />}
              onClick={addDialog.open}
            >
              Add Site
            </Button>
          ),
        }}
        emptyStateConfig={{
          icon: Building2,
          title: 'Not set up at any site',
          description: 'Add a site to let it order this item from this supplier.',
          action: (
            <Button
              permission={LE_SUPPLIERS.siteItems.add}
              startAdornment={<Plus className="size-4" />}
              onClick={addDialog.open}
            >
              Add Site
            </Button>
          ),
        }}
      />

      <Dialog
        handle={addDialog}
        icon={Building2}
        title="Add Site"
        description="Set this item up at one of the supplier's enrolled sites."
        content={(close) => (
          <AddSupplierSiteItemDialog supplierId={supplierId} itemId={itemId} onSuccess={close} onCancel={close} />
        )}
      />
    </>
  );
};
