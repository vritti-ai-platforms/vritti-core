import type { RunsTableParams } from '@/schemas/actions';

export const GITEA_ACTIONS_KEY = ['gitea', 'actions'] as const;

export const GITEA_REPOSITORY_ACTIONS_KEY = (name: string) => [...GITEA_ACTIONS_KEY, name] as const;

export const GITEA_WORKFLOWS_KEY = (name: string) => [...GITEA_REPOSITORY_ACTIONS_KEY(name), 'workflows'] as const;

// Run lists and single runs sit under separate prefixes deliberately: deleting a run has to invalidate
// every list without touching the deleted run's own entries, which would refetch straight into a 404
export const GITEA_RUN_LISTS_KEY = (name: string) => [...GITEA_REPOSITORY_ACTIONS_KEY(name), 'run-lists'] as const;

export const GITEA_RUNS_TABLE_KEY = (name: string, params: RunsTableParams) =>
  [...GITEA_RUN_LISTS_KEY(name), params] as const;

export const GITEA_RUN_KEY = (name: string, runId: number) =>
  [...GITEA_REPOSITORY_ACTIONS_KEY(name), 'runs', runId] as const;

export const GITEA_RUN_JOBS_KEY = (name: string, runId: number) => [...GITEA_RUN_KEY(name, runId), 'jobs'] as const;

// The phase is part of the key so that a job going terminal forces one last read: the final poll of a
// running job can land before its closing lines are written, which would leave the log short for good
export const GITEA_JOB_LOGS_KEY = (name: string, jobId: number, phase: 'tailing' | 'final') =>
  [...GITEA_REPOSITORY_ACTIONS_KEY(name), 'job-logs', jobId, phase] as const;

// How often a run, job or log is re-read while the git service still reports work in flight. Each query
// turns polling off the moment `isActive` goes false, so no interval outlives its subject.
export const ACTIVE_POLL_INTERVAL_MS = 5000;
