import type { TableResponse } from '@vritti/quantum-ui/types/api-response';
import { z } from '@vritti/quantum-ui/zod';

// Mirrors REF_PATTERN in DispatchWorkflowDto — git forbids spaces and glob metacharacters in ref names
const REF_PATTERN = /^[A-Za-z0-9._\-/]+$/;

export const dispatchWorkflowSchema = z.object({
  ref: z
    .string()
    .min(1, 'A branch, tag or commit is required')
    .max(255, 'Ref must be at most 255 characters')
    .regex(REF_PATTERN, 'Letters, numbers, dots, underscores, hyphens, and slashes only'),
});

export type DispatchWorkflowFormData = z.infer<typeof dispatchWorkflowSchema>;

export type ActionStatus = 'waiting' | 'queued' | 'running' | 'completed';

export type ActionConclusion = 'success' | 'failure' | 'cancelled' | 'skipped';

// `id` is the workflow FILE NAME (e.g. `ci.yaml`), so it needs percent-encoding in a URL
export interface WorkflowData {
  id: string;
  name: string;
  path: string;
  state: string;
  isActive: boolean;
  updatedAt: string;
}

export interface WorkflowListResponse {
  items: WorkflowData[];
}

export interface DispatchWorkflowData {
  ref: string;
  inputs?: Record<string, string>;
}

// isActive is precomputed by the gateway — true while the run can still change, which is what drives polling
export interface RunData {
  id: number;
  runNumber: number;
  title: string;
  event: string;
  status: ActionStatus;
  conclusion: ActionConclusion | null;
  isActive: boolean;
  workflowId: string | null;
  headBranch: string | null;
  headSha: string | null;
  runAttempt: number;
  startedAt: string | null;
  completedAt: string | null;
  actor: string | null;
}

// The table endpoint answers with the rows plus the table state the server applied, so pagination
// never has to be mirrored on this side
export type RunsTableResponse = TableResponse<RunData>;

// Scopes the table to one workflow file. Not part of the table state: the selection lives in the
// workflows panel beside the table, not in the table's own chrome.
export interface RunsTableParams {
  workflowId?: string;
}

export interface JobStepData {
  name: string;
  number: number;
  status: ActionStatus;
  conclusion: ActionConclusion | null;
  startedAt: string | null;
  completedAt: string | null;
}

export interface JobData {
  id: number;
  name: string;
  status: ActionStatus;
  conclusion: ActionConclusion | null;
  isActive: boolean;
  runnerName: string | null;
  startedAt: string | null;
  completedAt: string | null;
  steps: JobStepData[];
}

export interface JobListResponse {
  items: JobData[];
}

// isTruncated is set when the log outgrew the gateway's cap and only its tail was kept
export interface JobLogsData {
  content: string;
  isTruncated: boolean;
}
