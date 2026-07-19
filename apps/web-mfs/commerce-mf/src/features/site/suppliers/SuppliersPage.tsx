import { useQueryClient } from '@tanstack/react-query';
import { SITE_SUPPLIERS } from '@vritti/commerce-permissions/suppliers';
import { Badge } from '@vritti/quantum-ui/Badge';
import { Button } from '@vritti/quantum-ui/Button';
import { type ColumnDef, DataTable, RowActions, StringCell, useDataTable } from '@vritti/quantum-ui/DataTable';
import { Dialog } from '@vritti/quantum-ui/Dialog';
import { useDialog } from '@vritti/quantum-ui/hooks';
import { PageHeader } from '@vritti/quantum-ui/PageHeader';
import { buildSlug } from '@vritti/quantum-ui/slug';
import { Eye, Plus, Truck } from 'lucide-react';
import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { SITE_SUPPLIERS_TABLE_KEY, useSiteSuppliersTable } from '@/hooks/site/suppliers';
import type { SiteSupplierRow } from '@/schemas/site-suppliers';
import { EnrollSupplierDialog } from './forms/EnrollSupplierDialog';

export const SuppliersPage = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: response, isLoading } = useSiteSuppliersTable();
  const enrollDialog = useDialog();

  const columns = useMemo<ColumnDef<SiteSupplierRow>[]>(
    () => [
      {
        accessorKey: 'code',
        header: 'Code',
        cell: ({ row }) => <StringCell value={row.original.code} mono />,
        enableSorting: true,
      },
      {
        accessorKey: 'partyName',
        header: 'Company',
        enableSorting: true,
      },
      {
        accessorKey: 'currencyCode',
        header: 'Currency',
        enableSorting: true,
      },
      {
        accessorKey: 'enrollmentActive',
        header: 'Status',
        cell: ({ row }) => (
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={row.original.enrollmentActive ? 'success' : 'outline'}>
              {row.original.enrollmentActive ? 'Active' : 'Inactive'}
            </Badge>
            {row.original.purchasingBlocked && <Badge variant="destructive">Blocked</Badge>}
          </div>
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
                id: 'view',
                icon: Eye,
                label: 'View',
                permission: SITE_SUPPLIERS.view,
                onClick: () => navigate(buildSlug(row.original.partyName, row.original.id)),
              },
            ]}
          />
        ),
      },
    ],
    [navigate],
  );

  const { table } = useDataTable({
    columns,
    slug: 'commerce-site-suppliers',
    label: 'supplier',
    serverState: response,
    enableRowSelection: false,
    enableSorting: true,
    enableMultiSort: false,
    onStatePush: () => queryClient.invalidateQueries({ queryKey: SITE_SUPPLIERS_TABLE_KEY }),
  });

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Suppliers" description="Suppliers enrolled at this site" />

      <DataTable
        table={table}
        isLoading={isLoading}
        permission={SITE_SUPPLIERS.view}
        searchConfig={{
          columns: [
            { id: 'partyName', label: 'Company' },
            { id: 'code', label: 'Code' },
          ],
          searchAll: true,
        }}
        toolbarActions={{
          actions: (
            <Button size="sm" permission={SITE_SUPPLIERS.add} onClick={enrollDialog.open}>
              <Plus className="mr-2 size-4" />
              Enroll Supplier
            </Button>
          ),
        }}
        emptyStateConfig={{
          icon: Truck,
          title: 'No enrolled suppliers',
          description: 'Enroll a supplier to start purchasing at this site.',
          action: (
            <Button permission={SITE_SUPPLIERS.add} onClick={enrollDialog.open}>
              <Plus className="mr-2 size-4" />
              Enroll Supplier
            </Button>
          ),
        }}
      />

      <Dialog
        handle={enrollDialog}
        icon={Truck}
        title="Enroll Supplier"
        description="Only suppliers not yet enrolled at this site are shown."
        content={(close) => <EnrollSupplierDialog onSuccess={close} onCancel={close} />}
      />
    </div>
  );
};
