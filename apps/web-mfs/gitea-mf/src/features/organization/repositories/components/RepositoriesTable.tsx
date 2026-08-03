import { useQueryClient } from '@tanstack/react-query';
import { ORG_REPOSITORIES } from '@vritti/commerce-permissions/repositories';
import { Badge } from '@vritti/quantum-ui/Badge';
import { Button } from '@vritti/quantum-ui/Button';
import {
  type ColumnDef,
  DataTable,
  DateTimeCell,
  RowActions,
  StringCell,
  useDataTable,
} from '@vritti/quantum-ui/DataTable';
import { Dialog } from '@vritti/quantum-ui/Dialog';
import { useDialog } from '@vritti/quantum-ui/hooks';
import { Eye, GitBranch, Plus } from 'lucide-react';
import type React from 'react';
import { useNavigate } from 'react-router-dom';
import { GITEA_REPOSITORIES_TABLE_KEY, useRepositories } from '@/hooks/organization/repositories';
import type { RepositoryData } from '@/schemas/repositories';
import { CreateRepositoryDialog } from '../forms/CreateRepositoryDialog';

const TABLE_SLUG = 'gitea-org-repositories';

export const RepositoriesTable: React.FC = () => {
  const createDialog = useDialog();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: response, isLoading } = useRepositories();

  // Sorting and search are off deliberately: the git service paginates but cannot sort or filter, so
  // either control would silently act on the current page only.
  const { table } = useDataTable({
    columns: getColumns({ onView: (repository) => navigate(repository.name) }),
    slug: TABLE_SLUG,
    label: 'repository',
    serverState: response,
    enableRowSelection: false,
    enableSorting: false,
    onStatePush: () => queryClient.invalidateQueries({ queryKey: GITEA_REPOSITORIES_TABLE_KEY }),
  });

  const newRepositoryButton = (
    <Button
      size="sm"
      startAdornment={<Plus className="size-4" />}
      onClick={createDialog.open}
      permission={ORG_REPOSITORIES.add}
    >
      New repository
    </Button>
  );

  return (
    <>
      <DataTable
        table={table}
        isLoading={isLoading}
        permission={ORG_REPOSITORIES.view}
        // Named views round-trip table state through the backend; the git service has none, so the
        // views chrome would only issue pointless table-views requests.
        enableViews={false}
        onRowClick={(repository) => navigate(repository.name)}
        toolbarActions={{ actions: newRepositoryButton }}
        emptyStateConfig={{
          icon: GitBranch,
          title: 'No repositories yet',
          description: 'Create your first repository to start tracking code.',
          action: (
            <Button
              startAdornment={<Plus className="size-4" />}
              onClick={createDialog.open}
              permission={ORG_REPOSITORIES.add}
            >
              New repository
            </Button>
          ),
        }}
      />

      <Dialog
        handle={createDialog}
        icon={GitBranch}
        title="New repository"
        description="Creates a repository inside your organization's git namespace."
        content={(close) => <CreateRepositoryDialog onSuccess={close} onCancel={close} />}
      />
    </>
  );
};

interface ColumnActions {
  onView: (repository: RepositoryData) => void;
}

// Every column carries an explicit size: DataTable takes the table's minWidth from their total, so the
// TanStack default of 150px each would force a horizontal scrollbar the content does not need.
function getColumns({ onView }: ColumnActions): ColumnDef<RepositoryData, unknown>[] {
  return [
    {
      accessorKey: 'name',
      header: 'Name',
      cell: ({ row }) => <StringCell value={row.original.name} mono />,
      enableSorting: false,
      size: 180,
    },
    { accessorKey: 'description', header: 'Description', enableSorting: false, size: 240 },
    {
      accessorKey: 'isPrivate',
      header: 'Visibility',
      cell: ({ row }) => <Badge variant="outline">{row.original.isPrivate ? 'Private' : 'Public'}</Badge>,
      enableSorting: false,
      size: 100,
    },
    {
      accessorKey: 'defaultBranch',
      header: 'Default branch',
      cell: ({ row }) => <StringCell value={row.original.defaultBranch} mono />,
      enableSorting: false,
      size: 130,
    },
    {
      accessorKey: 'cloneUrl',
      header: 'Clone URL',
      cell: ({ row }) => <StringCell value={row.original.cloneUrl} mono />,
      enableSorting: false,
      size: 220,
    },
    {
      accessorKey: 'updatedAt',
      header: 'Last updated',
      cell: ({ row }) => <DateTimeCell value={row.original.updatedAt} />,
      enableSorting: false,
      size: 160,
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => (
        <RowActions actions={[{ id: 'view', icon: Eye, label: 'View', onClick: () => onView(row.original) }]} />
      ),
      enableSorting: false,
      enableHiding: false,
      size: 70,
    },
  ];
}
