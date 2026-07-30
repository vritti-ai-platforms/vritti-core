import { axios } from '@vritti/quantum-ui/axios';
import type { SuccessResponse } from '@vritti/quantum-ui/types/api-response';
import type {
  DispatchWorkflowData,
  JobListResponse,
  JobLogsData,
  RunData,
  RunsTableParams,
  RunsTableResponse,
  WorkflowListResponse,
} from '@/schemas/actions';

// Every Actions endpoint hangs off the repository it belongs to
function actionsBase(name: string): string {
  return `gitea-api/repositories/${name}/actions`;
}

// A workflow id is a file name, so it carries a dot and has to be percent-encoded in a path segment
function workflowBase(name: string, workflowId: string): string {
  return `${actionsBase(name)}/workflows/${encodeURIComponent(workflowId)}`;
}

// Fetches the workflow files defined in the repository
export function listWorkflows(name: string): Promise<WorkflowListResponse> {
  return axios.get<WorkflowListResponse>(`${actionsBase(name)}/workflows`).then((r) => r.data);
}

// Queues a run of a workflow against a ref; answers null when the git service reports no run details
export function dispatchWorkflow(
  name: string,
  workflowId: string,
  data: DispatchWorkflowData,
): Promise<RunData | null> {
  return axios.post<RunData | null>(`${workflowBase(name, workflowId)}/dispatches`, data).then((r) => r.data);
}

// Enables a workflow so it can be triggered again
export function enableWorkflow(name: string, workflowId: string): Promise<SuccessResponse> {
  return axios.put<SuccessResponse>(`${workflowBase(name, workflowId)}/enable`).then((r) => r.data);
}

// Disables a workflow, leaving its file in place
export function disableWorkflow(name: string, workflowId: string): Promise<SuccessResponse> {
  return axios.put<SuccessResponse>(`${workflowBase(name, workflowId)}/disable`).then((r) => r.data);
}

// Fetches the workflow runs table, optionally scoped to one workflow file. The server reads the pushed
// table state and applies pagination itself.
export function getRunsTable(name: string, params: RunsTableParams): Promise<RunsTableResponse> {
  return axios.get<RunsTableResponse>(`${actionsBase(name)}/runs/table`, { params }).then((r) => r.data);
}

// Fetches a single run
export function getRun(name: string, runId: number): Promise<RunData> {
  return axios.get<RunData>(`${actionsBase(name)}/runs/${runId}`).then((r) => r.data);
}

// Fetches a run's jobs, each with its steps
export function listRunJobs(name: string, runId: number): Promise<JobListResponse> {
  return axios.get<JobListResponse>(`${actionsBase(name)}/runs/${runId}/jobs`).then((r) => r.data);
}

// Fetches a job's raw log text
export function getJobLogs(name: string, jobId: number): Promise<JobLogsData> {
  return axios.get<JobLogsData>(`${actionsBase(name)}/jobs/${jobId}/logs`).then((r) => r.data);
}

// Re-queues every job of a run
export function rerunRun(name: string, runId: number): Promise<SuccessResponse> {
  return axios.post<SuccessResponse>(`${actionsBase(name)}/runs/${runId}/rerun`).then((r) => r.data);
}

// Re-queues only the jobs of a run that failed
export function rerunFailedJobs(name: string, runId: number): Promise<SuccessResponse> {
  return axios.post<SuccessResponse>(`${actionsBase(name)}/runs/${runId}/rerun-failed-jobs`).then((r) => r.data);
}

// Permanently deletes a run and its logs
export function deleteRun(name: string, runId: number): Promise<SuccessResponse> {
  return axios.delete<SuccessResponse>(`${actionsBase(name)}/runs/${runId}`).then((r) => r.data);
}
