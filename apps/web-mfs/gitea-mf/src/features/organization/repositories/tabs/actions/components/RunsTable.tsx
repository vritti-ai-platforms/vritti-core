import { useQueryClient } from '@tanstack/react-query';
import { ORG_REPOSITORIES } from '@vritti/gitea-permissions/repository';
import { Button } from '@vritti/quantum-ui/Button';
import { cn } from '@vritti/quantum-ui/cn';
import {
  type ColumnDef,
  DataTable,
  type RowAction,
  RowActions,
  StringCell,
  useDataTable,
} from '@vritti/quantum-ui/DataTable';
import { useConfirm } from '@vritti/quantum-ui/hooks';
import { buildSlug } from '@vritti/quantum-ui/slug';
import { Eye, Play, RefreshCw, RotateCcw, Trash2, TriangleAlert } from 'lucide-react';
import type React from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  GITEA_RUN_LISTS_KEY,
  useDeleteRun,
  useRerunFailedJobs,
  useRerunRun,
  useRuns,
} from '@/hooks/organization/actions';
import type { RunData } from '@/schemas/actions';
import { formatActionDuration } from '../utils/actions';
import { ActionStatusBadge } from './ActionStatusBadge';

const TABLE_SLUG = 'gitea-org-action-runs';

interface RunsTableProps {
  repositoryName: string;
}

export const RunsTable: React.FC<RunsTableProps> = ({ repositoryName }) => {
  const confirm = useConfirm();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  // The filter is URL state, so the panel and this table both read it rather than one telling the other.
  // Empty means every workflow in the repository.
  const [searchParams] = useSearchParams();
  const workflowId = searchParams.get('workflow') ?? '';

  // This table renders at `<repository>/actions`, and a run's route is `actions/:runSlug`. The run number
  // is what both the table and the run page call it, so it is the name the slug carries.
  const onSelectRun = (run: RunData) =>
    navigate(buildSlug(`Run ${run.runNumber}`, String(run.id)), { relative: 'path' });

  const { data: response, isLoading, isFetching } = useRuns(repositoryName, { workflowId: workflowId || undefined });

  const rerunMutation = useRerunRun(repositoryName);
  const rerunFailedMutation = useRerunFailedJobs(repositoryName);
  const deleteMutation = useDeleteRun(repositoryName);

  const handleDelete = async (run: RunData) => {
    const confirmed = await confirm({
      title: `Delete run #${run.runNumber}?`,
      description: `Run #${run.runNumber} of ${run.workflowId ?? 'this repository'} and all of its job logs will be permanently removed. This cannot be undone.`,
      confirmLabel: 'Delete',
      variant: 'destructive',
    });
    if (confirmed) deleteMutation.mutate(run.id);
  };

  // Sorting and search are off deliberately: the git service paginates but cannot sort or filter, so
  // either control would silently act on the current page only.
  const { table } = useDataTable({
    columns: getColumns({
      onView: onSelectRun,
      onRerun: (run) => rerunMutation.mutate(run.id),
      onRerunFailed: (run) => rerunFailedMutation.mutate(run.id),
      onDelete: handleDelete,
      isRerunPending: rerunMutation.isPending,
      isRerunFailedPending: rerunFailedMutation.isPending,
    }),
    slug: TABLE_SLUG,
    label: 'run',
    serverState: response,
    enableRowSelection: false,
    enableSorting: false,
    onStatePush: () => queryClient.invalidateQueries({ queryKey: GITEA_RUN_LISTS_KEY(repositoryName) }),
  });

  // This list does not poll — a run only changes when a runner touches it, and a queued run nothing
  // picks up would keep an interval alive forever, so refreshing is an explicit action.
  const refreshButton = (
    <Button
      variant="outline"
      size="sm"
      disabled={isFetching}
      permission={ORG_REPOSITORIES.actions.runs.view}
      startAdornment={<RefreshCw className={cn('size-4', isFetching && 'animate-spin')} />}
      onClick={() => queryClient.invalidateQueries({ queryKey: GITEA_RUN_LISTS_KEY(repositoryName) })}
    >
      Refresh
    </Button>
  );

  return (
    <DataTable
      table={table}
      isLoading={isLoading}
      mode="tab"
      toolbarActions={{ actions: refreshButton }}
      permission={ORG_REPOSITORIES.actions.runs.view}
      // Named views round-trip table state through the backend; the git service has none, so the views
      // chrome would only issue pointless table-views requests.
      enableViews={false}
      onRowClick={onSelectRun}
      emptyStateConfig={{
        icon: Play,
        title: 'No runs yet',
        description: workflowId
          ? `${workflowId} has not been run on this repository yet.`
          : 'Push to a branch with a workflow, or run one by hand from the workflows list.',
      }}
    />
  );
};

interface ColumnActions {
  onView: (run: RunData) => void;
  onRerun: (run: RunData) => void;
  onRerunFailed: (run: RunData) => void;
  onDelete: (run: RunData) => void;
  isRerunPending: boolean;
  isRerunFailedPending: boolean;
}

// Every column carries an explicit size: DataTable takes the table's minWidth from their total, so the
// TanStack default of 150px each would force this tab to scroll sideways. Event and actor share one
// Trigger column for the same reason — both also read in full on the run page.
function getColumns({
  onView,
  onRerun,
  onRerunFailed,
  onDelete,
  isRerunPending,
  isRerunFailedPending,
}: ColumnActions): ColumnDef<RunData, unknown>[] {
  return [
    {
      accessorKey: 'runNumber',
      header: 'Run',
      cell: ({ row }) => <StringCell value={`#${row.original.runNumber}`} mono />,
      enableSorting: false,
      size: 80,
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => <ActionStatusBadge status={row.original.status} conclusion={row.original.conclusion} />,
      enableSorting: false,
      size: 130,
    },
    { accessorKey: 'title', header: 'Title', enableSorting: false, size: 230 },
    {
      accessorKey: 'workflowId',
      header: 'Workflow',
      cell: ({ row }) => <StringCell value={row.original.workflowId} mono />,
      enableSorting: false,
      size: 150,
    },
    {
      accessorKey: 'headBranch',
      header: 'Branch',
      cell: ({ row }) => <StringCell value={row.original.headBranch} mono />,
      enableSorting: false,
      size: 130,
    },
    {
      id: 'trigger',
      header: 'Trigger',
      cell: ({ row }) => (
        <div className="flex flex-col">
          <StringCell value={row.original.event} mono />
          <StringCell value={row.original.actor} className="text-xs text-muted-foreground" />
        </div>
      ),
      enableSorting: false,
      size: 140,
    },
    {
      id: 'duration',
      header: 'Duration',
      cell: ({ row }) => (
        <StringCell value={formatActionDuration(row.original.startedAt, row.original.completedAt)} mono />
      ),
      enableSorting: false,
      size: 90,
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => {
        const run = row.original;
        const actions: RowAction[] = [
          {
            id: 'view',
            icon: Eye,
            label: 'View',
            onClick: () => onView(run),
          },
          {
            id: 'rerun',
            icon: RotateCcw,
            label: 'Re-run',
            permission: ORG_REPOSITORIES.actions.runs.rerun,
            // Gitea refuses to re-queue a run that has not finished yet
            disabled: run.isActive || isRerunPending,
            onClick: () => onRerun(run),
          },
          {
            id: 'rerun-failed',
            icon: TriangleAlert,
            label: 'Re-run failed jobs',
            permission: ORG_REPOSITORIES.actions.runs.rerun,
            disabled: run.conclusion !== 'failure' || isRerunFailedPending,
            onClick: () => onRerunFailed(run),
          },
          {
            id: 'delete',
            icon: Trash2,
            label: 'Delete',
            variant: 'destructive',
            permission: ORG_REPOSITORIES.actions.runs.delete,
            onClick: () => onDelete(run),
          },
        ];
        return <RowActions actions={actions} />;
      },
      enableSorting: false,
      enableHiding: false,
      size: 70,
    },
  ];
}
