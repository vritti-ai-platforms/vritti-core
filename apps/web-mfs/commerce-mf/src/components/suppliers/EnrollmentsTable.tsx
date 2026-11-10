import { useQueryClient } from '@tanstack/react-query';
import { Badge } from '@vritti/quantum-ui/Badge';
import { Button } from '@vritti/quantum-ui/Button';
import { type ColumnDef, DataTable, RowActions, StringCell, useDataTable } from '@vritti/quantum-ui/DataTable';
import { Dialog } from '@vritti/quantum-ui/Dialog';
import { useConfirm, useDialog } from '@vritti/quantum-ui/hooks';
import { SelectFilter } from '@vritti/quantum-ui/Select';
import { StatusSwitch } from '@vritti/quantum-ui/StatusSwitch';
import { Building2, Eye, Pencil, Plus, Trash2, Truck, UserPlus } from 'lucide-react';
import type React from 'react';
import { useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { SUPPLIER_ENROLLMENT_STATUS_OPTIONS, type SupplierEnrollmentRow } from '@/schemas/supplier-enrollments';
import type { SupplierEnrollmentBinding } from './bindings';
import { EditEnrollmentDialog } from './forms/EditEnrollmentDialog';
import { EnrollDialog } from './forms/EnrollDialog';
import { SupplierBlockIcons } from './SupplierBlockIcons';

interface EnrollmentsTableProps {
  binding: SupplierEnrollmentBinding;
  // A tab inside a detail page, or the page's own table
  mode?: 'page' | 'tab';
}

function siteLabel(row: SupplierEnrollmentRow): string {
  return row.siteName ?? row.siteCode ?? 'the site';
}

// The other side of the row's pair, as a confirm or dialog names it
function counterpartLabel(row: SupplierEnrollmentRow, rows: 'sites' | 'suppliers'): string {
  return rows === 'sites' ? siteLabel(row) : row.partyName;
}

// Every (supplier, site) pair on one side of an enrollment — a supplier's sites, or a site's suppliers
export const EnrollmentsTable: React.FC<EnrollmentsTableProps> = ({ binding, mode = 'page' }) => {
  const { table: tableBinding, permissions } = binding;
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const confirm = useConfirm();
  const enrollDialog = useDialog();
  const scope = tableBinding.useScope();
  const enrollmentsTableQuery = tableBinding.useTable(scope);
  const setActiveMutation = binding.useSetEnrollmentActive();
  const deleteMutation = binding.useDeleteEnrollment();
  const listsSites = tableBinding.rows === 'sites';

  const openRow = useCallback(
    (row: SupplierEnrollmentRow) => navigate(tableBinding.rowPath(row), { relative: 'path' }),
    [navigate, tableBinding],
  );

  const handleUnenroll = useCallback(
    async (row: SupplierEnrollmentRow) => {
      const confirmed = await confirm({
        title: `Unenroll "${row.partyName}" from ${siteLabel(row)}?`,
        description: 'The site will no longer be able to purchase from this supplier. Its price history is kept.',
        confirmLabel: 'Unenroll',
        variant: 'destructive',
      });
      if (confirmed) deleteMutation.mutate({ supplierId: row.supplierId, siteId: row.siteId });
    },
    [confirm, deleteMutation],
  );

  const columns = useMemo<ColumnDef<SupplierEnrollmentRow>[]>(
    () => [
      ...(listsSites
        ? [
            {
              accessorKey: 'siteName',
              header: 'Site',
              cell: ({ row }) => <StringCell value={row.original.siteName ?? row.original.siteCode} />,
              enableSorting: true,
            } satisfies ColumnDef<SupplierEnrollmentRow>,
            {
              accessorKey: 'siteCode',
              header: 'Code',
              cell: ({ row }) => <StringCell value={row.original.siteCode} mono />,
              enableSorting: true,
            } satisfies ColumnDef<SupplierEnrollmentRow>,
          ]
        : [
            {
              accessorKey: 'partyName',
              header: 'Supplier',
              cell: ({ row }) => (
                <div className="flex flex-col items-center gap-0.5">
                  <span>{row.original.partyName}</span>
                  <span className="inline-flex items-center gap-2">
                    <span className="font-mono text-xs text-muted-foreground">{row.original.currencyCode}</span>
                    <SupplierBlockIcons
                      purchasingBlocked={row.original.purchasingBlocked}
                      paymentBlocked={row.original.paymentBlocked}
                    />
                  </span>
                </div>
              ),
              size: 260,
              enableSorting: true,
            } satisfies ColumnDef<SupplierEnrollmentRow>,
          ]),
      {
        accessorKey: 'isActive',
        header: () => <div className="text-center">Status</div>,
        cell: ({ row }) =>
          row.original.enrollmentStatus !== 'ENROLLED' ? (
            <Badge variant="outline">Not Enrolled</Badge>
          ) : (
            // Toggling the switch must not open the row as well
            // biome-ignore lint/a11y/noStaticElementInteractions: swallows the row click around an accessible switch
            // biome-ignore lint/a11y/useKeyWithClickEvents: the switch inside handles its own keyboard input
            <div className="flex justify-center" onClick={(event) => event.stopPropagation()}>
              <StatusSwitch
                checked={row.original.isActive === true}
                permission={permissions.editEnroll}
                disabled={!row.original.isSupplierActive}
                disabledTip={
                  'This supplier is deactivated at LE, so it cannot be bought from at any site. Activate the supplier first.'
                }
                isLoading={setActiveMutation.isPending}
                onCheckedChange={(isActive) =>
                  setActiveMutation.mutate({
                    supplierId: row.original.supplierId,
                    siteId: row.original.siteId,
                    isActive,
                  })
                }
                ariaLabel={`Mark ${row.original.partyName} active at ${siteLabel(row.original)}`}
              />
            </div>
          ),
        enableSorting: false,
      },
      {
        accessorKey: 'paymentTermName',
        header: 'Payment Term',
        cell: ({ row }) => <StringCell value={row.original.paymentTermName} />,
        enableSorting: false,
      },
      {
        accessorKey: 'registrationNumber',
        header: 'Tax Registration',
        cell: ({ row }) => <StringCell value={row.original.registrationNumber} mono />,
        enableSorting: false,
      },
      {
        accessorKey: 'bankAccountName',
        header: 'Bank Account',
        cell: ({ row }) => <StringCell value={row.original.bankAccountName} />,
        enableSorting: false,
      },
      {
        accessorKey: 'orderContactName',
        header: 'Order Contact',
        cell: ({ row }) => <StringCell value={row.original.orderContactName ?? row.original.orderContactLabel} />,
        enableSorting: false,
      },
      {
        id: 'actions',
        header: '',
        enableSorting: false,
        enableHiding: false,
        cell: ({ row }) => {
          const enrollment = row.original;
          const pair = { supplierId: enrollment.supplierId, siteId: enrollment.siteId };
          const enrolled = enrollment.enrollmentStatus === 'ENROLLED';
          return (
            <RowActions
              actions={[
                {
                  id: 'view',
                  icon: Eye,
                  label: 'View',
                  permission: permissions.view,
                  onClick: () => openRow(enrollment),
                },
                {
                  id: 'enroll',
                  icon: UserPlus,
                  label: 'Enroll Supplier',
                  permission: permissions.enroll,
                  hidden: enrolled,
                  dialog: {
                    title: 'Enroll Supplier',
                    description: `Choose the payment term, tax registration, bank account and order contact for ${counterpartLabel(enrollment, tableBinding.rows)}.`,
                    content: (close) => (
                      <EnrollDialog binding={binding} pair={pair} onSuccess={close} onCancel={close} />
                    ),
                  },
                },
                {
                  id: 'edit',
                  icon: Pencil,
                  label: 'Edit Enrollment',
                  permission: permissions.editEnroll,
                  hidden: !enrolled,
                  dialog: {
                    title: 'Edit Enrollment',
                    description: 'Update the payment term, tax registration, bank account and order contact.',
                    content: (close) =>
                      enrollment.enrollmentStatus === 'ENROLLED' ? (
                        <EditEnrollmentDialog
                          binding={binding}
                          pair={pair}
                          enrollment={enrollment}
                          onSuccess={close}
                          onCancel={close}
                        />
                      ) : null,
                  },
                },
                {
                  id: 'unenroll',
                  icon: Trash2,
                  label: 'Unenroll',
                  variant: 'destructive',
                  permission: permissions.unenroll,
                  hidden: !enrolled,
                  onClick: () => handleUnenroll(enrollment),
                },
              ]}
            />
          );
        },
      },
    ],
    [binding, tableBinding, permissions, listsSites, setActiveMutation, openRow, handleUnenroll],
  );

  const enrollmentsTable = useDataTable({
    columns,
    query: enrollmentsTableQuery,
    slug: tableBinding.slug(scope),
    label: listsSites ? 'site' : 'supplier',
    enableRowSelection: false,
    enableSorting: true,
    enableMultiSort: false,
    onStatePush: () => queryClient.invalidateQueries({ queryKey: tableBinding.queryKey(scope) }),
  });

  const EmptyIcon = listsSites ? Building2 : Truck;

  return (
    <>
      <DataTable
        table={enrollmentsTable}
        mode={mode}
        permission={permissions.view}
        onRowClick={openRow}
        searchConfig={{
          columns: listsSites
            ? [
                { id: 'siteName', label: 'Site' },
                { id: 'siteCode', label: 'Code' },
              ]
            : [
                { id: 'partyName', label: 'Supplier' },
                { id: 'supplierCode', label: 'Code' },
              ],
          searchAll: true,
        }}
        filters={[
          <SelectFilter
            key="enrollmentStatus"
            name="enrollmentStatus"
            label="Enrollment Status"
            options={SUPPLIER_ENROLLMENT_STATUS_OPTIONS}
          />,
        ]}
        toolbarActions={{
          actions: (
            <Button
              size="sm"
              permission={permissions.enroll}
              startAdornment={<Plus className="size-4" />}
              onClick={enrollDialog.open}
            >
              Enroll Supplier
            </Button>
          ),
        }}
        emptyStateConfig={
          listsSites
            ? { icon: EmptyIcon, title: 'No sites', description: 'The legal entity has no sites yet.' }
            : { icon: EmptyIcon, title: 'No suppliers', description: 'The legal entity has no suppliers yet.' }
        }
      />

      <Dialog
        handle={enrollDialog}
        icon={EmptyIcon}
        title="Enroll Supplier"
        description={
          listsSites
            ? 'Choose the site, payment term, tax registration, bank account and order contact.'
            : 'Choose the supplier, payment term, tax registration, bank account and order contact.'
        }
        content={(close) => <EnrollDialog binding={binding} pair={scope} onSuccess={close} onCancel={close} />}
      />
    </>
  );
};
