import { useQueryClient } from '@tanstack/react-query';
import { ORG_COMPANIES } from '@vritti/commerce-permissions/companies';
import { Badge } from '@vritti/quantum-ui/Badge';
import { Button } from '@vritti/quantum-ui/Button';
import { type ColumnDef, DataTable, RowActions, StringCell, useDataTable } from '@vritti/quantum-ui/DataTable';
import { Dialog } from '@vritti/quantum-ui/Dialog';
import { useConfirm, useDialog } from '@vritti/quantum-ui/hooks';
import { FileText, Pencil, Plus, Trash2 } from 'lucide-react';
import type React from 'react';
import { useCallback, useMemo } from 'react';
import {
  COMPANY_REGISTRATIONS_TABLE_KEY,
  useCompanyRegistrationsTable,
  useDeleteCompanyRegistration,
} from '@/hooks/organization/companies';
import { type CompanyTaxRegistrationRow, REGISTRATION_TYPE_LABELS } from '@/schemas/companies';
import { AddRegistrationDialog } from '../forms/AddRegistrationDialog';
import { EditRegistrationDialog } from '../forms/EditRegistrationDialog';

interface RegistrationsTabProps {
  companyId: string;
}

export const RegistrationsTab: React.FC<RegistrationsTabProps> = ({ companyId }) => {
  const queryClient = useQueryClient();
  const confirm = useConfirm();
  const addDialog = useDialog();
  const { data: response, isLoading } = useCompanyRegistrationsTable(companyId);
  const deleteMutation = useDeleteCompanyRegistration(companyId);

  const handleDelete = useCallback(
    async (row: CompanyTaxRegistrationRow) => {
      const confirmed = await confirm({
        title: 'Delete registration?',
        description: `Delete the "${REGISTRATION_TYPE_LABELS[row.registrationType]}" registration ${row.registrationNumber}?`,
        confirmLabel: 'Delete',
        variant: 'destructive',
      });
      if (confirmed) deleteMutation.mutate(row.id);
    },
    [confirm, deleteMutation],
  );

  const columns = useMemo<ColumnDef<CompanyTaxRegistrationRow>[]>(
    () => [
      {
        accessorKey: 'jurisdictionName',
        header: 'Jurisdiction',
        cell: ({ row }) => <StringCell value={row.original.jurisdictionName} />,
        enableSorting: true,
      },
      {
        accessorKey: 'registrationNumber',
        header: 'Number',
        cell: ({ row }) => <StringCell value={row.original.registrationNumber} mono />,
      },
      {
        accessorKey: 'registrationType',
        header: 'Type',
        cell: ({ row }) => <Badge variant="outline">{REGISTRATION_TYPE_LABELS[row.original.registrationType]}</Badge>,
      },
      {
        accessorKey: 'isPrimary',
        header: 'Primary',
        cell: ({ row }) =>
          row.original.isPrimary ? (
            <Badge variant="secondary" className="bg-success/15 text-success">
              Primary
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
            actions={[
              {
                id: 'edit',
                icon: Pencil,
                label: 'Edit',
                permission: ORG_COMPANIES.registrations.edit,
                dialog: {
                  title: 'Edit Tax Registration',
                  description: 'Update the details for this tax registration.',
                  content: (close) => (
                    <EditRegistrationDialog
                      companyId={companyId}
                      registration={row.original}
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
                variant: 'destructive',
                permission: ORG_COMPANIES.registrations.delete,
                onClick: () => handleDelete(row.original),
              },
            ]}
          />
        ),
        enableSorting: false,
        enableHiding: false,
      },
    ],
    [companyId, handleDelete],
  );

  const { table } = useDataTable({
    columns,
    serverState: response,
    slug: `commerce-org-company-${companyId}-registrations`,
    label: 'registration',
    enableRowSelection: false,
    enableSorting: true,
    onStatePush: () => queryClient.invalidateQueries({ queryKey: COMPANY_REGISTRATIONS_TABLE_KEY(companyId) }),
  });

  return (
    <>
      <DataTable
        table={table}
        mode="tab"
        isLoading={isLoading}
        permission={ORG_COMPANIES.registrations.view}
        toolbarActions={{
          actions: (
            <Button
              size="sm"
              permission={ORG_COMPANIES.registrations.add}
              startAdornment={<Plus className="size-4" />}
              onClick={addDialog.open}
            >
              Add Registration
            </Button>
          ),
        }}
        emptyStateConfig={{
          icon: FileText,
          title: 'No tax registrations',
          description: 'Record this company’s tax registration numbers per jurisdiction.',
          action: (
            <Button
              permission={ORG_COMPANIES.registrations.add}
              startAdornment={<Plus className="size-4" />}
              onClick={addDialog.open}
            >
              Add Registration
            </Button>
          ),
        }}
      />

      <Dialog
        handle={addDialog}
        icon={FileText}
        title="Add Tax Registration"
        description="Record a tax registration number for this company in a jurisdiction."
        content={(close) => <AddRegistrationDialog companyId={companyId} onSuccess={close} onCancel={close} />}
      />
    </>
  );
};
