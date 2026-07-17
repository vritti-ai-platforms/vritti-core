import { useQueryClient } from '@tanstack/react-query';
import { ORG_PEOPLE } from '@vritti/commerce-permissions/people';
import { Badge } from '@vritti/quantum-ui/Badge';
import { Button } from '@vritti/quantum-ui/Button';
import { type ColumnDef, DataTable, RowActions, StringCell, useDataTable } from '@vritti/quantum-ui/DataTable';
import { Dialog } from '@vritti/quantum-ui/Dialog';
import { useDialog } from '@vritti/quantum-ui/hooks';
import { PageHeader } from '@vritti/quantum-ui/PageHeader';
import { buildSlug } from '@vritti/quantum-ui/slug';
import { Eye, Plus, Users } from 'lucide-react';
import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { PEOPLE_TABLE_KEY, usePeopleTable } from '@/hooks/organization/people';
import type { PersonData } from '@/schemas/people';
import { AddPersonDialog } from './forms/AddPersonDialog';

export const PeoplePage = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: response, isLoading } = usePeopleTable();
  const addDialog = useDialog();

  const columns = useMemo<ColumnDef<PersonData>[]>(
    () => [
      {
        accessorKey: 'displayName',
        header: 'Name',
        enableSorting: true,
      },
      {
        accessorKey: 'email',
        header: 'Email',
        cell: ({ row }) => <StringCell value={row.original.email} />,
        enableSorting: false,
      },
      {
        accessorKey: 'phone',
        header: 'Phone',
        cell: ({ row }) => <StringCell value={row.original.phone} />,
        enableSorting: false,
      },
      {
        accessorKey: 'isActive',
        header: 'Status',
        cell: ({ row }) => (
          <Badge
            variant={row.original.isActive ? 'secondary' : 'outline'}
            className={row.original.isActive ? 'bg-success/15 text-success' : ''}
          >
            {row.original.isActive ? 'Active' : 'Inactive'}
          </Badge>
        ),
        enableSorting: true,
      },
      {
        id: 'actions',
        header: '',
        cell: ({ row }) => (
          <RowActions
            actions={[
              {
                id: 'view',
                icon: Eye,
                label: 'View',
                onClick: () => navigate(buildSlug(row.original.displayName, row.original.id)),
              },
            ]}
          />
        ),
        enableSorting: false,
        enableHiding: false,
      },
    ],
    [navigate],
  );

  const { table } = useDataTable({
    columns,
    slug: 'commerce-org-people',
    label: 'person',
    serverState: response,
    enableRowSelection: false,
    enableSorting: true,
    enableMultiSort: false,
    onStatePush: () => queryClient.invalidateQueries({ queryKey: PEOPLE_TABLE_KEY }),
  });

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="People" description="Individuals you do business with — one shared identity across the org." />

      <DataTable
        table={table}
        isLoading={isLoading}
        permission={ORG_PEOPLE.view}
        onRowClick={(row) => navigate(buildSlug(row.displayName, row.id))}
        searchConfig={{
          columns: [{ id: 'displayName', label: 'Name' }],
          searchAll: true,
        }}
        toolbarActions={{
          actions: (
            <Button
              size="sm"
              permission={ORG_PEOPLE.add}
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
          description: 'Add your first person — an individual you do business with.',
          action: (
            <Button permission={ORG_PEOPLE.add} startAdornment={<Plus className="size-4" />} onClick={addDialog.open}>
              Add Person
            </Button>
          ),
        }}
      />

      <Dialog
        handle={addDialog}
        icon={Users}
        title="Add Person"
        description="Create a new individual you do business with."
        className="max-w-3xl"
        content={(close) => <AddPersonDialog onSuccess={close} onCancel={close} />}
      />
    </div>
  );
};
