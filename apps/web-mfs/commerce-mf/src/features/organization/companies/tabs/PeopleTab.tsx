import { useQueryClient } from '@tanstack/react-query';
import { ORG_COMPANIES } from '@vritti/commerce-permissions/companies';
import { Button } from '@vritti/quantum-ui/Button';
import { type ColumnDef, DataTable, RowActions, StringCell, useDataTable } from '@vritti/quantum-ui/DataTable';
import { Dialog } from '@vritti/quantum-ui/Dialog';
import { useConfirm, useDialog } from '@vritti/quantum-ui/hooks';
import { Pencil, Plus, Trash2, Users } from 'lucide-react';
import type React from 'react';
import { useCallback, useMemo } from 'react';
import {
  COMPANY_PEOPLE_TABLE_KEY,
  useCompanyPeopleTable,
  useRemoveCompanyPerson,
} from '@/hooks/organization/companies';
import { CONTACT_FUNCTION_LABELS, type CompanyPersonRow } from '@/schemas/companies';
import { FunctionChips } from '../../party/FunctionChips';
import { AddCompanyPersonDialog } from '../forms/AddCompanyPersonDialog';
import { EditCompanyPersonDialog } from '../forms/EditCompanyPersonDialog';

interface PeopleTabProps {
  companyId: string;
}

export const PeopleTab: React.FC<PeopleTabProps> = ({ companyId }) => {
  const queryClient = useQueryClient();
  const confirm = useConfirm();
  const addDialog = useDialog();
  const { data: response, isLoading } = useCompanyPeopleTable(companyId);
  const removeMutation = useRemoveCompanyPerson(companyId);

  const handleRemove = useCallback(
    async (row: CompanyPersonRow) => {
      const confirmed = await confirm({
        title: 'Remove person?',
        description: `Remove "${row.childName}" from this company?`,
        confirmLabel: 'Remove',
        variant: 'destructive',
      });
      if (confirmed) removeMutation.mutate(row.id);
    },
    [confirm, removeMutation],
  );

  const columns = useMemo<ColumnDef<CompanyPersonRow>[]>(
    () => [
      {
        accessorKey: 'childName',
        header: 'Name',
        enableSorting: true,
      },
      {
        accessorKey: 'jobTitle',
        header: 'Job Title',
        cell: ({ row }) => <StringCell value={row.original.jobTitle} />,
      },
      {
        accessorKey: 'childEmail',
        header: 'Email',
        cell: ({ row }) => <StringCell value={row.original.childEmail} />,
      },
      {
        accessorKey: 'childPhone',
        header: 'Phone',
        cell: ({ row }) => <StringCell value={row.original.childPhone} mono />,
      },
      {
        accessorKey: 'functions',
        header: 'Handles',
        enableSorting: false,
        cell: ({ row }) => <FunctionChips functions={row.original.functions} labels={CONTACT_FUNCTION_LABELS} />,
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
                permission: ORG_COMPANIES.people.edit,
                dialog: {
                  title: 'Edit Person',
                  description: 'Update the role and contact functions for this person.',
                  content: (close) => (
                    <EditCompanyPersonDialog
                      companyId={companyId}
                      person={row.original}
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
                permission: ORG_COMPANIES.people.delete,
                onClick: () => handleRemove(row.original),
              },
            ]}
          />
        ),
        enableSorting: false,
        enableHiding: false,
      },
    ],
    [handleRemove, companyId],
  );

  const { table } = useDataTable({
    columns,
    serverState: response,
    slug: `commerce-org-company-${companyId}-people`,
    label: 'person',
    enableRowSelection: false,
    enableSorting: true,
    onStatePush: () => queryClient.invalidateQueries({ queryKey: COMPANY_PEOPLE_TABLE_KEY(companyId) }),
  });

  return (
    <>
      <DataTable
        table={table}
        mode="tab"
        isLoading={isLoading}
        permission={ORG_COMPANIES.people.view}
        toolbarActions={{
          actions: (
            <Button
              size="sm"
              permission={ORG_COMPANIES.people.add}
              startAdornment={<Plus className="size-4" />}
              onClick={addDialog.open}
            >
              Add Person
            </Button>
          ),
        }}
        emptyStateConfig={{
          icon: Users,
          title: 'No people',
          description: 'Link a person to this company to record who to reach and how.',
          action: (
            <Button
              permission={ORG_COMPANIES.people.add}
              startAdornment={<Plus className="size-4" />}
              onClick={addDialog.open}
            >
              Add Person
            </Button>
          ),
        }}
      />

      <Dialog
        handle={addDialog}
        icon={Users}
        title="Add Person"
        description="Link a person to this company with their role and contact functions."
        content={(close) => <AddCompanyPersonDialog companyId={companyId} onSuccess={close} onCancel={close} />}
      />
    </>
  );
};
