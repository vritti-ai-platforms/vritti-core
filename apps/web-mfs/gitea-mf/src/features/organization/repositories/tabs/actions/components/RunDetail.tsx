import { Button } from '@vritti/quantum-ui/Button';
import { Card, CardContent } from '@vritti/quantum-ui/Card';
import { Collapsible } from '@vritti/quantum-ui/Collapsible';
import { cn } from '@vritti/quantum-ui/cn';
import { DetailField } from '@vritti/quantum-ui/DetailField';
import { Empty } from '@vritti/quantum-ui/Empty';
import { Boxes, ScrollText } from 'lucide-react';
import type React from 'react';
import { useSearchParams } from 'react-router-dom';
import { useRun, useRunJobs } from '@/hooks/organization/actions';
import type { JobData } from '@/schemas/actions';
import { actionTimestamp, formatActionDuration, parseIdParam } from '../utils/actions';
import { ActionStatusBadge } from './ActionStatusBadge';
import { JobListSkeleton } from './JobListSkeleton';
import { JobLogViewer } from './JobLogViewer';

const SHORT_SHA_LENGTH = 7;

interface JobRowProps {
  job: JobData;
  isSelected: boolean;
  onSelectJob: (jobId: number) => void;
}

const JobRow: React.FC<JobRowProps> = ({ job, isSelected, onSelectJob }) => (
  <div className={cn('px-4 py-3', isSelected && 'bg-muted')}>
    <Collapsible
      headerClassName="justify-between gap-4"
      trigger={<span className="truncate text-sm">{job.name}</span>}
      trailing={
        <div className="flex shrink-0 items-center gap-2">
          <span className="text-xs text-muted-foreground">
            {formatActionDuration(job.startedAt, job.completedAt) ?? ''}
          </span>
          <ActionStatusBadge status={job.status} conclusion={job.conclusion} />
          <Button
            variant="ghost"
            size="sm"
            startAdornment={<ScrollText className="size-4" />}
            onClick={() => onSelectJob(job.id)}
          >
            Logs
          </Button>
        </div>
      }
    >
      {job.steps.length === 0 ? (
        <p className="mt-2 pl-5 text-xs text-muted-foreground">No steps reported yet.</p>
      ) : (
        <ol className="mt-2 ml-5 flex flex-col gap-2 border-l border-border pl-4">
          {job.steps.map((step) => (
            <li key={step.number} className="flex items-center justify-between gap-4 text-sm">
              <span className="flex min-w-0 items-center gap-2">
                <span className="w-6 shrink-0 font-mono text-xs text-muted-foreground">{step.number}</span>
                <span className="truncate">{step.name}</span>
              </span>
              <span className="flex shrink-0 items-center gap-2">
                <span className="text-xs text-muted-foreground">
                  {formatActionDuration(step.startedAt, step.completedAt) ?? ''}
                </span>
                <ActionStatusBadge status={step.status} conclusion={step.conclusion} />
              </span>
            </li>
          ))}
        </ol>
      )}

      {job.runnerName && <p className="mt-2 pl-5 text-xs text-muted-foreground">Runner: {job.runnerName}</p>}
    </Collapsible>
  </div>
);

interface RunDetailProps {
  repositoryName: string;
  runId: number;
}

// The run's title, status and actions live in the page header above this body
export const RunDetail: React.FC<RunDetailProps> = ({ repositoryName, runId }) => {
  // Reads the run itself rather than taking it down from the page — the query key is shared, so the two
  // callers are one request
  const { data: run } = useRun(repositoryName, runId);
  const { data: jobs, isLoading: isLoadingJobs } = useRunJobs(repositoryName, runId);

  // The open job is a pane inside this card, so this is the only component that needs the param
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedJobId = parseIdParam(searchParams.get('job'));

  const onSelectJob = (nextJobId: number | null) => {
    const params = new URLSearchParams(searchParams);
    if (nextJobId === null) params.delete('job');
    else params.set('job', String(nextJobId));
    setSearchParams(params);
  };

  const selectedJob = jobs?.items.find((job) => job.id === selectedJobId) ?? null;

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <DetailField label="Workflow" type="string" value={run.workflowId} mono />
          <DetailField label="Branch" type="string" value={run.headBranch} mono />
          <DetailField label="Event" type="string" value={run.event} mono />
          <DetailField
            label="Commit"
            type="string"
            value={run.headSha ? run.headSha.slice(0, SHORT_SHA_LENGTH) : null}
            mono
          />
          <DetailField label="Triggered by" type="string" value={run.actor} />
          <DetailField label="Duration" type="string" value={formatActionDuration(run.startedAt, run.completedAt)} />
          <DetailField label="Started" type="dateTime" value={actionTimestamp(run.startedAt)} />
          <DetailField label="Completed" type="dateTime" value={actionTimestamp(run.completedAt)} />
        </CardContent>
      </Card>

      {/* py-0 so the job rows reach the card's edges; the placeholder states supply their own padding */}
      <Card className="overflow-hidden py-0">
        <div className="border-b border-border bg-muted/40 px-4 py-2 text-xs text-muted-foreground">Jobs</div>

        {isLoadingJobs || !jobs ? (
          <JobListSkeleton />
        ) : jobs.items.length === 0 ? (
          <Empty
            icon={<Boxes />}
            title="No jobs"
            description="This run has not been picked up by a runner yet, so it has no jobs to show."
          />
        ) : (
          <div className="divide-y divide-border">
            {jobs.items.map((job) => (
              <JobRow key={job.id} job={job} isSelected={job.id === selectedJobId} onSelectJob={onSelectJob} />
            ))}
          </div>
        )}
      </Card>

      {selectedJob && (
        <JobLogViewer repositoryName={repositoryName} job={selectedJob} onClose={() => onSelectJob(null)} />
      )}
    </div>
  );
};
