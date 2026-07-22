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
import { SUPPLIER_SITES_TABLE_KEY, useRemoveSupplierSite, useSupplierSitesTable } from '@/hooks/legal-entity/suppliers';
import type { SupplierSiteRow } from '@/schemas/suppliers';
import { AddSupplierSiteDialog } from '../forms/AddSupplierSiteDialog';
import { EditSupplierSiteDialog } from '../forms/EditSupplierSiteDialog';

interface SitesTabProps {
  supplierId: string;
  partyId: string;
}

export const SitesTab: React.FC<SitesTabProps> = ({ supplierId, partyId }) => {
  const queryClient = useQueryClient();
  const confirm = useConfirm();
  const addDialog = useDialog();
  const { data: response, isLoading } = useSupplierSitesTable(supplierId);
  const removeMutation = useRemoveSupplierSite(supplierId);

  const handleRemove = useCallback(
    async (row: SupplierSiteRow) => {
      const confirmed = await confirm({
        title: `Remove "${row.siteName ?? 'site'}"?`,
        description: 'This site will no longer be able to purchase from this supplier.',
        confirmLabel: 'Remove',
        variant: 'destructive',
      });
      if (confirmed) removeMutation.mutate(row.id);
    },
    [confirm, removeMutation],
  );

  const columns = useMemo<ColumnDef<SupplierSiteRow>[]>(
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
        accessorKey: 'registrationNumber',
        header: 'Origin Registration',
        cell: ({ row }) =>
          row.original.registrationNumber ? (
            <StringCell value={row.original.registrationNumber} mono />
          ) : (
            <Badge variant="warning">Not set</Badge>
          ),
      },
      {
        accessorKey: 'bankAccountName',
        header: 'Branch Bank',
        cell: ({ row }) =>
          row.original.bankAccountName ? (
            <StringCell value={row.original.bankAccountName} />
          ) : (
            <Badge variant="outline">Company primary</Badge>
          ),
      },
      {
        accessorKey: 'orderContactName',
        header: 'Order Contact',
        enableSorting: false,
        cell: ({ row }) =>
          row.original.orderContactName || row.original.orderContactLabel ? (
            <StringCell value={row.original.orderContactName ?? row.original.orderContactLabel} />
          ) : (
            <Badge variant="outline">Not set</Badge>
          ),
      },
      {
        accessorKey: 'isActive',
        header: 'Status',
        cell: ({ row }) => (
          <Badge variant={row.original.isActive ? 'success' : 'outline'}>
            {row.original.isActive ? 'Active' : 'Inactive'}
          </Badge>
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
                permission: LE_SUPPLIERS.sites.edit,
                dialog: {
                  title: 'Edit Site Enrollment',
                  description: 'Update the origin registration and branch bank picks for this site.',
                  content: (close) => (
                    <EditSupplierSiteDialog
                      supplierId={supplierId}
                      partyId={partyId}
                      site={row.original}
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
                permission: LE_SUPPLIERS.sites.delete,
                onClick: () => handleRemove(row.original),
              },
            ]}
          />
        ),
        enableSorting: false,
        enableHiding: false,
      },
    ],
    [supplierId, partyId, handleRemove],
  );

  const { table } = useDataTable({
    columns,
    serverState: response,
    slug: `commerce-supplier-${supplierId}-sites`,
    label: 'site',
    enableRowSelection: false,
    enableSorting: true,
    enableMultiSort: false,
    onStatePush: () => queryClient.invalidateQueries({ queryKey: SUPPLIER_SITES_TABLE_KEY(supplierId) }),
  });

  return (
    <>
      <DataTable
        table={table}
        mode="tab"
        isLoading={isLoading}
        permission={LE_SUPPLIERS.sites.view}
        toolbarActions={{
          actions: (
            <Button
              size="sm"
              permission={LE_SUPPLIERS.sites.add}
              startAdornment={<Plus className="size-4" />}
              onClick={addDialog.open}
            >
              Enroll Site
            </Button>
          ),
        }}
        emptyStateConfig={{
          icon: Building2,
          title: 'No enrolled sites',
          description: 'Enroll a site so it can purchase from this supplier.',
          action: (
            <Button
              permission={LE_SUPPLIERS.sites.add}
              startAdornment={<Plus className="size-4" />}
              onClick={addDialog.open}
            >
              Enroll Site
            </Button>
          ),
        }}
      />

      <Dialog
        handle={addDialog}
        icon={Building2}
        title="Enroll Site"
        description="Enroll a site so it can purchase from this supplier."
        content={(close) => (
          <AddSupplierSiteDialog supplierId={supplierId} partyId={partyId} onSuccess={close} onCancel={close} />
        )}
      />
    </>
  );
};
