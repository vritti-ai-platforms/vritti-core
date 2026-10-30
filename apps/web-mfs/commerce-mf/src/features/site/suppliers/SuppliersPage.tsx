import { useQueryClient } from '@tanstack/react-query';
import { SITE_SUPPLIERS } from '@vritti/commerce-permissions/suppliers';
import { Badge } from '@vritti/quantum-ui/Badge';
import { Button } from '@vritti/quantum-ui/Button';
import {
  type ColumnDef,
  DataTable,
  getSelectionColumn,
  RowActions,
  StringCell,
  useDataTable,
} from '@vritti/quantum-ui/DataTable';
import { Dialog } from '@vritti/quantum-ui/Dialog';
import { useDialog } from '@vritti/quantum-ui/hooks';
import { PageHeader } from '@vritti/quantum-ui/PageHeader';
import { SelectFilter } from '@vritti/quantum-ui/Select';
import { buildSlug } from '@vritti/quantum-ui/slug';
import { Eye, Plus, Truck, UserPlus } from 'lucide-react';
import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { SITE_SUPPLIERS_TABLE_KEY, useSiteSuppliersTable } from '@/hooks/site/suppliers';
import { SITE_ENROLLMENT_STATUS_OPTIONS, type SiteSupplierListRow } from '@/schemas/site-suppliers';
import { EnrollSupplierDialog } from './forms/EnrollSupplierDialog';

export const SuppliersPage = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: response, isLoading } = useSiteSuppliersTable();
  const enrollDialog = useDialog();

  const columns = useMemo<ColumnDef<SiteSupplierListRow>[]>(
    () => [
      getSelectionColumn<SiteSupplierListRow>(),
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
        accessorKey: 'paymentTermName',
        header: 'Payment Term',
        cell: ({ row }) => <StringCell value={row.original.paymentTermName} />,
        enableSorting: true,
      },
      {
        accessorKey: 'enrollmentStatus',
        header: 'Enrollment Status',
        cell: ({ row }) =>
          row.original.enrollmentStatus === 'ENROLLED' ? (
            <Badge variant="success">Enrolled</Badge>
          ) : (
            <Badge variant="outline">Not Enrolled</Badge>
          ),
        enableSorting: false,
      },
      {
        id: 'actions',
        header: '',
        enableSorting: false,
        enableHiding: false,
        cell: ({ row }) => {
          const supplier = row.original;
          const enrolled = supplier.enrollmentStatus === 'ENROLLED';
          return (
            <RowActions
              actions={[
                {
                  id: 'view',
                  icon: Eye,
                  label: 'View',
                  permission: SITE_SUPPLIERS.view,
                  onClick: () => navigate(buildSlug(supplier.partyName, supplier.id)),
                },
                {
                  id: 'enroll',
                  icon: UserPlus,
                  label: 'Enroll Supplier',
                  permission: SITE_SUPPLIERS.enroll,
                  hidden: enrolled,
                  dialog: {
                    title: 'Enroll Supplier',
                    description: `Choose the payment term, tax registration, bank account and order contact for ${supplier.partyName}.`,
                    content: (close) => (
                      <EnrollSupplierDialog
                        supplier={{
                          id: supplier.id,
                          partyId: supplier.partyId,
                          defaultPaymentTermId: supplier.defaultPaymentTermId,
                        }}
                        onSuccess={close}
                        onCancel={close}
                      />
                    ),
                  },
                },
              ]}
            />
          );
        },
      },
    ],
    [navigate],
  );

  const { table } = useDataTable({
    columns,
    slug: 'commerce-site-suppliers',
    label: 'supplier',
    serverState: response,
    enableRowSelection: true,
    enableSorting: true,
    enableMultiSort: false,
    onStatePush: () => queryClient.invalidateQueries({ queryKey: SITE_SUPPLIERS_TABLE_KEY }),
  });

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Suppliers" description="All suppliers with their enrollment status" />

      <DataTable
        table={table}
        isLoading={isLoading}
        permission={SITE_SUPPLIERS.view}
        filters={[
          <SelectFilter
            key="enrollmentStatus"
            name="enrollmentStatus"
            label="Enrollment Status"
            options={SITE_ENROLLMENT_STATUS_OPTIONS}
          />,
        ]}
        toolbarActions={{
          actions: (
            <Button
              size="sm"
              permission={SITE_SUPPLIERS.enroll}
              startAdornment={<Plus className="size-4" />}
              onClick={enrollDialog.open}
            >
              Enroll Supplier
            </Button>
          ),
        }}
        searchConfig={{
          columns: [
            { id: 'partyName', label: 'Company' },
            { id: 'code', label: 'Code' },
          ],
          searchAll: true,
        }}
        emptyStateConfig={{
          icon: Truck,
          title: 'No suppliers',
          description: 'Enroll a supplier to start purchasing.',
          action: (
            <Button
              permission={SITE_SUPPLIERS.enroll}
              startAdornment={<Plus className="size-4" />}
              onClick={enrollDialog.open}
            >
              Enroll Supplier
            </Button>
          ),
        }}
      />

      <Dialog
        handle={enrollDialog}
        icon={Truck}
        title="Enroll Supplier"
        description="Only suppliers that are not yet enrolled are shown."
        content={(close) => <EnrollSupplierDialog onSuccess={close} onCancel={close} />}
      />
    </div>
  );
};
