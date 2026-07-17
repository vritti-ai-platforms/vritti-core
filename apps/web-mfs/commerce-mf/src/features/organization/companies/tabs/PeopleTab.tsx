import { useQueryClient } from '@tanstack/react-query';
import { ORG_COMPANIES } from '@vritti/commerce-permissions/companies';
import { Badge } from '@vritti/quantum-ui/Badge';
import { Button } from '@vritti/quantum-ui/Button';
import { type ColumnDef, DataTable, RowActions, StringCell, useDataTable } from '@vritti/quantum-ui/DataTable';
import { Dialog } from '@vritti/quantum-ui/Dialog';
import { useConfirm, useDialog } from '@vritti/quantum-ui/hooks';
import { Plus, Trash2, Users } from 'lucide-react';
import type React from 'react';
import { useCallback, useMemo } from 'react';
import {
  COMPANY_PEOPLE_TABLE_KEY,
  useCompanyPeopleTable,
  useRemoveCompanyPerson,
} from '@/hooks/organization/companies';
import type { CompanyPersonRow } from '@/schemas/companies';
import { AddCompanyPersonDialog } from '../forms/AddCompanyPersonDialog';

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
        accessorKey: 'secondaryPhone',
        header: 'Secondary Phone',
        cell: ({ row }) => <StringCell value={row.original.secondaryPhone} />,
      },
      {
        accessorKey: 'secondaryEmail',
        header: 'Secondary Email',
        cell: ({ row }) => <StringCell value={row.original.secondaryEmail} />,
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
    [handleRemove],
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
        description="Link a person to this company with their role and secondary details."
        content={(close) => <AddCompanyPersonDialog companyId={companyId} onSuccess={close} onCancel={close} />}
      />
    </>
  );
};
