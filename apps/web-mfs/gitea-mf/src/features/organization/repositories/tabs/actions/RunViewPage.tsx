import { ORG_REPOSITORIES } from '@vritti/gitea-permissions/repository';
import { Badge } from '@vritti/quantum-ui/Badge';
import { Button } from '@vritti/quantum-ui/Button';
import { useConfirm, useSlugParams } from '@vritti/quantum-ui/hooks';
import { PageHeader } from '@vritti/quantum-ui/PageHeader';
import { RotateCcw, Trash2, TriangleAlert } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useDeleteRun, useRerunFailedJobs, useRerunRun, useRun } from '@/hooks/organization/actions';
import { ActionStatusBadge } from './components/ActionStatusBadge';
import { RunDetail } from './components/RunDetail';

export const RunViewPage = () => {
  // `repoName` carries no separator, so its `id` is the raw repository name
  const { repoName, runSlug } = useSlugParams('repoName', 'runSlug');
  const repositoryName = repoName.id;
  const runId = Number(runSlug.id);

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
              permission={ORG_REPOSITORIES.actions.runs.rerun}
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
              permission={ORG_REPOSITORIES.actions.runs.rerun}
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
              permission={ORG_REPOSITORIES.actions.runs.delete}
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
