import { useQueryClient } from '@tanstack/react-query';
import { LE_TAX_REGISTRATIONS } from '@vritti/commerce-permissions/tax-registrations';
import { Badge } from '@vritti/quantum-ui/Badge';
import { Button } from '@vritti/quantum-ui/Button';
import { type ColumnDef, DataTable, RowActions, StringCell, useDataTable } from '@vritti/quantum-ui/DataTable';
import { Dialog } from '@vritti/quantum-ui/Dialog';
import { useConfirm, useDialog } from '@vritti/quantum-ui/hooks';
import { PageHeader } from '@vritti/quantum-ui/PageHeader';
import { SelectFilter } from '@vritti/quantum-ui/Select';
import { BadgeCheck, Pencil, Plus, Trash2 } from 'lucide-react';
import { useCallback, useMemo } from 'react';
import {
  TAX_REGISTRATIONS_TABLE_KEY,
  useDeleteTaxRegistration,
  useTaxRegistrationsTable,
} from '@/hooks/legal-entity/tax-registrations';
import type { TaxRegistrationData } from '@/schemas/tax-registrations';
import { AddTaxRegistrationDialog } from './forms/AddTaxRegistrationDialog';
import { EditTaxRegistrationDialog } from './forms/EditTaxRegistrationDialog';

export const TaxRegistrationsPage = () => {
  const queryClient = useQueryClient();
  const { data: response, isLoading } = useTaxRegistrationsTable();
  const deleteMutation = useDeleteTaxRegistration();
  const addDialog = useDialog();
  const confirm = useConfirm();

  const handleDelete = useCallback(
    async (registration: TaxRegistrationData) => {
      const confirmed = await confirm({
        title: `Remove "${registration.registrationNumber}"?`,
        description: 'Sites trading under this registration must be reassigned first.',
        confirmLabel: 'Remove',
        variant: 'destructive',
      });
      if (confirmed) deleteMutation.mutate(registration.id);
    },
    [confirm, deleteMutation],
  );

  const columns = useMemo<ColumnDef<TaxRegistrationData>[]>(
    () => [
      {
        accessorKey: 'registrationNumber',
        header: () => <div className="text-center">Number</div>,
        cell: ({ row }) => (
          <div className="flex justify-center">
            <StringCell value={row.original.registrationNumber} mono />
          </div>
        ),
        enableSorting: true,
      },
      {
        accessorKey: 'registrationType',
        header: () => <div className="text-center">Type</div>,
        cell: ({ row }) => (
          <div className="flex justify-center">
            <Badge variant="outline">{row.original.registrationType}</Badge>
          </div>
        ),
        enableSorting: false,
      },
      {
        accessorKey: 'jurisdictionId',
        header: () => <div className="text-center">Tax Jurisdiction</div>,
        cell: ({ row }) => (
          <div className="flex items-center justify-center gap-2">
            {row.original.jurisdictionName ?? '—'}
            {row.original.jurisdictionCode && (
              <span className="font-mono text-muted-foreground text-xs">{row.original.jurisdictionCode}</span>
            )}
          </div>
        ),
        enableSorting: false,
      },
      {
        accessorKey: 'isPrimary',
        header: () => <div className="text-center">Primary</div>,
        cell: ({ row }) => (
          <div className="flex justify-center">
            {row.original.isPrimary ? <Badge variant="success">Primary</Badge> : <span className="sr-only">No</span>}
          </div>
        ),
        enableSorting: false,
      },
      {
        accessorKey: 'isActive',
        header: () => <div className="text-center">Status</div>,
        cell: ({ row }) => (
          <div className="flex justify-center">
            <Badge variant={row.original.isActive ? 'secondary' : 'outline'}>
              {row.original.isActive ? 'Active' : 'Inactive'}
            </Badge>
          </div>
        ),
        enableSorting: false,
      },
      {
        id: 'actions',
        header: '',
        cell: ({ row }) => (
          <div className="flex justify-center">
            <RowActions
              actions={[
                {
                  id: 'edit',
                  icon: Pencil,
                  label: 'Edit',
                  permission: LE_TAX_REGISTRATIONS.edit,
                  dialog: {
                    title: 'Edit Tax Registration',
                    description: row.original.registrationNumber,
                    content: (close) => (
                      <EditTaxRegistrationDialog registration={row.original} onSuccess={close} onCancel={close} />
                    ),
                  },
                },
                {
                  id: 'delete',
                  icon: Trash2,
                  label: 'Remove',
                  permission: LE_TAX_REGISTRATIONS.delete,
                  variant: 'destructive',
                  disabled: deleteMutation.isPending,
                  onClick: () => handleDelete(row.original),
                },
              ]}
            />
          </div>
        ),
        enableSorting: false,
        enableHiding: false,
      },
    ],
    [deleteMutation.isPending, handleDelete],
  );

  const { table } = useDataTable({
    columns,
    slug: 'commerce-le-tax-registrations',
    label: 'tax registration',
    serverState: response,
    enableRowSelection: false,
    enableSorting: true,
    enableMultiSort: false,
    onStatePush: () => queryClient.invalidateQueries({ queryKey: TAX_REGISTRATIONS_TABLE_KEY }),
  });

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Tax Registrations"
        description="The GSTIN, VAT and other numbers this company is registered under"
      />

      <DataTable
        table={table}
        isLoading={isLoading}
        permission={LE_TAX_REGISTRATIONS.view}
        searchConfig={{ columns: [{ id: 'registrationNumber', label: 'Number' }], searchAll: true }}
        filters={[
          <SelectFilter
            key="isActive"
            name="isActive"
            label="Status"
            options={[
              { label: 'Active', value: 'true' },
              { label: 'Inactive', value: 'false' },
            ]}
          />,
        ]}
        toolbarActions={{
          actions: (
            <Button size="sm" onClick={addDialog.open} permission={LE_TAX_REGISTRATIONS.add}>
              <Plus className="mr-2 size-4" />
              Add Registration
            </Button>
          ),
        }}
        emptyStateConfig={{
          icon: BadgeCheck,
          title: 'No tax registrations yet',
          description: 'Add the GSTIN or VAT number this company files under so sales can be taxed correctly.',
        }}
      />

      <Dialog
        handle={addDialog}
        icon={BadgeCheck}
        title="Add Tax Registration"
        description="Record a number this company is registered under, and where it was issued."
        content={(close) => <AddTaxRegistrationDialog onSuccess={close} onCancel={close} />}
      />
    </div>
  );
};
