import { ORG_REPOSITORIES } from '@vritti/commerce-permissions/repositories';
import { Badge } from '@vritti/quantum-ui/Badge';
import { Button } from '@vritti/quantum-ui/Button';
import { useConfirm } from '@vritti/quantum-ui/hooks';
import { PageHeader } from '@vritti/quantum-ui/PageHeader';
import { RotateCcw, Trash2, TriangleAlert } from 'lucide-react';
import type React from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { useDeleteRun, useRerunFailedJobs, useRerunRun, useRun } from '@/hooks/organization/actions';
import { ActionStatusBadge } from './components/actions/ActionStatusBadge';
import { RunDetail } from './components/actions/RunDetail';
import { parseIdParam } from './utils/actions';

interface RunViewProps {
  repositoryName: string;
  runId: number;
}

const RunView: React.FC<RunViewProps> = ({ repositoryName, runId }) => {
  const navigate = useNavigate();
  const confirm = useConfirm();

  const { data: run } = useRun(repositoryName, runId);

  const rerunMutation = useRerunRun(repositoryName);
  const rerunFailedMutation = useRerunFailedJobs(repositoryName);
  // The runs list is the only sensible destination once the run is gone
  const deleteMutation = useDeleteRun(repositoryName, { onSuccess: () => navigate('..', { relative: 'path' }) });

  const handleDelete = async () => {
    const confirmed = await confirm({
      title: `Delete run #${run.runNumber}?`,
      description: `Run #${run.runNumber} of ${run.workflowId ?? 'this repository'} and all of its job logs will be permanently removed. This cannot be undone.`,
      confirmLabel: 'Delete',
      variant: 'destructive',
    });
    if (confirmed) deleteMutation.mutate(run.id);
  };

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={`Run #${run.runNumber}`}
        description={run.title || undefined}
        titleSlot={
          <div className="flex items-center gap-2">
            <ActionStatusBadge status={run.status} conclusion={run.conclusion} />
            {run.runAttempt > 1 && <Badge variant="outline">Attempt {run.runAttempt}</Badge>}
          </div>
        }
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              permission={ORG_REPOSITORIES.edit}
              startAdornment={<RotateCcw className="size-4" />}
              // Gitea refuses to re-queue a run that has not finished yet
              disabled={run.isActive || rerunMutation.isPending}
              disabledTip={run.isActive ? 'This run has not finished yet' : undefined}
              onClick={() => rerunMutation.mutate(run.id)}
            >
              Re-run
            </Button>
            <Button
              variant="outline"
              size="sm"
              permission={ORG_REPOSITORIES.edit}
              startAdornment={<TriangleAlert className="size-4" />}
              disabled={run.conclusion !== 'failure' || rerunFailedMutation.isPending}
              disabledTip={run.conclusion !== 'failure' ? 'This run has no failed jobs' : undefined}
              onClick={() => rerunFailedMutation.mutate(run.id)}
            >
              Re-run failed jobs
            </Button>
            <Button
              variant="ghost"
              size="icon"
              aria-label={`Delete run #${run.runNumber}`}
              className="text-destructive hover:text-destructive"
              permission={ORG_REPOSITORIES.delete}
              disabled={deleteMutation.isPending}
              onClick={handleDelete}
            >
              <Trash2 className="size-4" />
            </Button>
          </div>
        }
      />

      <RunDetail repositoryName={repositoryName} runId={runId} />
    </div>
  );
};

export const RunViewPage = () => {
  // Runs are keyed by a numeric Gitea id, not a name-uuid slug, so useSlugParams does not apply here
  const { repoName = '', runId } = useParams<{ repoName: string; runId: string }>();
  const parsedRunId = parseIdParam(runId ?? null);

  // A hand-edited run id can never resolve, so the runs list is the only place to send the user
  if (parsedRunId === null) return <Navigate to=".." relative="path" replace />;

  return <RunView repositoryName={repoName} runId={parsedRunId} />;
};
