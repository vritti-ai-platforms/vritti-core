import { ORG_REPOSITORIES } from '@vritti/commerce-permissions/repositories';
import { Badge } from '@vritti/quantum-ui/Badge';
import { Button } from '@vritti/quantum-ui/Button';
import {
  type ColumnDef,
  DataTable,
  DateTimeCell,
  type RowAction,
  RowActions,
  StringCell,
  useDataTable,
  useDataTableStore,
} from '@vritti/quantum-ui/DataTable';
import { Dialog } from '@vritti/quantum-ui/Dialog';
import { useDialog } from '@vritti/quantum-ui/hooks';
import { Eye, GitBranch, Plus } from 'lucide-react';
import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useRepositories } from '@/hooks/organization/repositories';
import type { RepositoryData } from '@/schemas/repositories';
import { CreateRepositoryDialog } from '../forms/CreateRepositoryDialog';

const TABLE_SLUG = 'gitea-org-repositories';
const DEFAULT_LIMIT = 20;

export const RepositoriesTable = () => {
  const createDialog = useDialog();
  const navigate = useNavigate();

  // The table owns pagination state and runs in manualPagination mode, so mirror it into the query.
  // The git service offers only page/limit — its cap of 50 matches the table's largest page size.
  const pagination = useDataTableStore((s) => s.tables[TABLE_SLUG]?.activeState.pagination);
  const limit = pagination?.limit ?? DEFAULT_LIMIT;
  const offset = pagination?.offset ?? 0;

  const { data: response, isLoading } = useRepositories({ page: Math.floor(offset / limit) + 1, limit });

  const columns = useMemo<ColumnDef<RepositoryData>[]>(
    () => [
      {
        accessorKey: 'name',
        header: 'Name',
        cell: ({ row }) => <StringCell value={row.original.name} mono />,
        enableSorting: false,
      },
      { accessorKey: 'description', header: 'Description', enableSorting: false },
      {
        accessorKey: 'isPrivate',
        header: 'Visibility',
        cell: ({ row }) => <Badge variant="outline">{row.original.isPrivate ? 'Private' : 'Public'}</Badge>,
        enableSorting: false,
      },
      {
        accessorKey: 'defaultBranch',
        header: 'Default branch',
        cell: ({ row }) => <StringCell value={row.original.defaultBranch} mono />,
        enableSorting: false,
      },
      {
        accessorKey: 'cloneUrl',
        header: 'Clone URL',
        cell: ({ row }) => <StringCell value={row.original.cloneUrl} mono />,
        enableSorting: false,
      },
      {
        accessorKey: 'updatedAt',
        header: 'Last updated',
        cell: ({ row }) => <DateTimeCell value={row.original.updatedAt} />,
        enableSorting: false,
      },
      {
        id: 'actions',
        header: '',
        cell: ({ row }) => {
          const actions: RowAction[] = [
            {
              id: 'view',
              icon: Eye,
              label: 'View',
              onClick: () => navigate(row.original.name),
            },
          ];
          return <RowActions actions={actions} />;
        },
        enableSorting: false,
        enableHiding: false,
      },
    ],
    [navigate],
  );

  // Sorting and search are off deliberately: the git service paginates but cannot sort or filter, so
  // either control would silently act on the current page only.
  const { table } = useDataTable({
    columns,
    slug: TABLE_SLUG,
    label: 'repository',
    serverState: { result: response?.items, count: response?.total },
    enableRowSelection: false,
    enableSorting: false,
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
        description="Creates a repository inside your organisation's git namespace."
        content={(close) => <CreateRepositoryDialog onSuccess={close} onCancel={close} />}
      />
    </>
  );
};
