import { Injectable, Logger } from '@nestjs/common';
import { DataTableStateService } from '@vritti/api-sdk/data-table';
import type { SuccessResponseDto } from '@vritti/api-sdk/database';
import { OrganizationGatewayService } from '../../organization/services/organization-gateway.service';
import { GiteaHttpService } from '../../services/gitea-http.service';
import { toGiteaFilters, toGiteaPaging } from '../../table-state.util';
import type { DispatchWorkflowDto } from '../dto/request/dispatch-workflow.dto';
import { type GiteaApiJobList, JobListResponseDto } from '../dto/response/job-list-response.dto';
import { JobLogsResponseDto } from '../dto/response/job-logs-response.dto';
import { type GiteaApiRun, type GiteaApiRunList, RunResponseDto } from '../dto/response/run-response.dto';
import type { RunTableResponseDto } from '../dto/response/run-table-response.dto';
import { type GiteaApiWorkflowList, WorkflowListResponseDto } from '../dto/response/workflow-list-response.dto';

// Must match the slug the frontend table registers under, or the two read different Redis keys
const RUNS_TABLE_SLUG = 'gitea-org-action-runs';

// The only run fields Gitea will filter on. A filter on anything else is round-tripped, not applied.
const GITEA_RUN_FILTERS = ['event', 'branch', 'status', 'actor'] as const;

// Run detail, job listing, logs, rerun and delete are routed only from Gitea 1.25. Older instances
// answer with a bare 404, which is indistinguishable from a deleted run — gate them instead.
const RUNS_MIN_VERSION = '1.25';
const RUNS_FEATURE = 'Repository actions';

@Injectable()
export class ActionsGatewayService {
  private readonly logger = new Logger(ActionsGatewayService.name);

  constructor(
    private readonly gitea: GiteaHttpService,
    private readonly organizationGatewayService: OrganizationGatewayService,
    private readonly dataTableStateService: DataTableStateService,
  ) {}

  // Resolves the repository's Gitea base path. `name` is a caller-supplied route param, so it is
  // percent-encoded — an unescaped `..` would let the request climb to another endpoint under the
  // site-admin token.
  private async repoBase(subdomain: string, name: string): Promise<string> {
    const namespace = await this.organizationGatewayService.requireNamespace(subdomain);
    return `/repos/${namespace}/${encodeURIComponent(name)}`;
  }

  // Fetches a page of runs, tolerating every route shape across Gitea versions.
  //   - `/actions/runs` is the listing from RUNS_MIN_VERSION onwards
  //   - `/actions/tasks` is the same payload under the older name, so it stands in verbatim
  //   - the per-workflow listing exists only on Gitea main; below that the scope is dropped rather
  //     than 404ing, so the table still renders (unfiltered) instead of erroring
  private async fetchRuns(
    base: string,
    params: Record<string, unknown>,
    workflowId?: string,
  ): Promise<GiteaApiRunList | null> {
    if (workflowId) {
      const scoped = await this.gitea.getOrNull<GiteaApiRunList>(
        `${base}/actions/workflows/${encodeURIComponent(workflowId)}/runs`,
        { params },
      );
      if (scoped) return scoped;
    }

    const runs = await this.gitea.getOrNull<GiteaApiRunList>(`${base}/actions/runs`, { params });
    if (runs) return runs;

    return this.gitea.getOrNull<GiteaApiRunList>(`${base}/actions/tasks`, { params });
  }

  // Lists the repository's workflows
  async listWorkflows(subdomain: string, name: string): Promise<WorkflowListResponseDto> {
    const base = await this.repoBase(subdomain, name);

    // A repository with no .gitea/workflows directory 404s rather than returning an empty list
    const response = await this.gitea.getOrNull<GiteaApiWorkflowList>(`${base}/actions/workflows`);

    return WorkflowListResponseDto.from(response);
  }

  // Triggers a workflow run against a ref.
  // Gitea rejects this when the workflow does not declare `on: workflow_dispatch`, and its API exposes
  // no trigger list, so there is no way to know that before trying — the rejection is surfaced as-is.
  async dispatchWorkflow(
    subdomain: string,
    name: string,
    workflowId: string,
    dto: DispatchWorkflowDto,
  ): Promise<RunResponseDto | null> {
    const base = await this.repoBase(subdomain, name);

    // return_run_details makes Gitea answer with the created run, so the caller can navigate to it
    const run = await this.gitea.post<GiteaApiRun | null>(
      `${base}/actions/workflows/${encodeURIComponent(workflowId)}/dispatches`,
      { ref: dto.ref, inputs: dto.inputs ?? {} },
      { params: { return_run_details: true } },
    );

    this.logger.log(`Dispatched ${name}/${workflowId} on ${dto.ref} (org=${subdomain})`);

    // A 204 leaves no body — the run list is the fallback for finding what was just queued
    return run ? RunResponseDto.from(run) : null;
  }

  // Enables or disables a workflow
  async setWorkflowEnabled(
    subdomain: string,
    name: string,
    workflowId: string,
    enabled: boolean,
  ): Promise<SuccessResponseDto> {
    const base = await this.repoBase(subdomain, name);
    const action = enabled ? 'enable' : 'disable';

    await this.gitea.put<void>(`${base}/actions/workflows/${encodeURIComponent(workflowId)}/${action}`);

    this.logger.log(`${enabled ? 'Enabled' : 'Disabled'} ${name}/${workflowId} (org=${subdomain})`);
    return { success: true, message: `Workflow ${enabled ? 'enabled' : 'disabled'} successfully.` };
  }

  // Returns a page of runs for the data table, with the view state the client last pushed.
  // Only pagination and the git service's four native filters are applied — see toGiteaFilters.
  async findRunsForTable(
    userId: string,
    subdomain: string,
    name: string,
    workflowId?: string,
  ): Promise<RunTableResponseDto> {
    const base = await this.repoBase(subdomain, name);
    const { state, activeViewId } = await this.dataTableStateService.getCurrentState(userId, RUNS_TABLE_SLUG);
    const { page, limit } = toGiteaPaging(state);

    const response = await this.fetchRuns(
      base,
      { page, limit, ...toGiteaFilters(state, GITEA_RUN_FILTERS) },
      workflowId,
    );

    // The total lives in the body, not a header — an instance with no runs endpoint at all yields none
    const runs = response?.workflow_runs ?? [];
    const total = response?.total_count ?? runs.length;

    return { result: runs.map(RunResponseDto.from), count: total, state, activeViewId };
  }

  // Returns a single run
  async findRun(subdomain: string, name: string, runId: number): Promise<RunResponseDto> {
    await this.gitea.requireMinVersion(RUNS_MIN_VERSION, RUNS_FEATURE);
    const base = await this.repoBase(subdomain, name);

    const run = await this.gitea.get<GiteaApiRun>(`${base}/actions/runs/${runId}`);

    return RunResponseDto.from(run);
  }

  // Returns the jobs of a run, each with its steps
  async listRunJobs(subdomain: string, name: string, runId: number): Promise<JobListResponseDto> {
    await this.gitea.requireMinVersion(RUNS_MIN_VERSION, RUNS_FEATURE);
    const base = await this.repoBase(subdomain, name);

    const response = await this.gitea.getOrNull<GiteaApiJobList>(`${base}/actions/runs/${runId}/jobs`);

    return JobListResponseDto.from(response);
  }

  // Returns a job's log output.
  // Gitea answers text/plain here even though its OpenAPI spec declares application/json, so the call
  // opts out of axios' JSON parsing.
  async getJobLogs(subdomain: string, name: string, jobId: number): Promise<JobLogsResponseDto> {
    await this.gitea.requireMinVersion(RUNS_MIN_VERSION, RUNS_FEATURE);
    const base = await this.repoBase(subdomain, name);

    const content = await this.gitea.getOrNull<string>(`${base}/actions/jobs/${jobId}/logs`, {
      responseType: 'text',
    });

    // A queued job has produced nothing yet, which Gitea reports as a 404
    return JobLogsResponseDto.from(content ?? '');
  }

  // Re-runs a whole run, or only the jobs that failed
  async rerun(subdomain: string, name: string, runId: number, failedOnly: boolean): Promise<SuccessResponseDto> {
    await this.gitea.requireMinVersion(RUNS_MIN_VERSION, RUNS_FEATURE);
    const base = await this.repoBase(subdomain, name);
    const path = failedOnly ? 'rerun-failed-jobs' : 'rerun';

    await this.gitea.post<void>(`${base}/actions/runs/${runId}/${path}`);

    this.logger.log(`Re-ran ${failedOnly ? 'failed jobs of ' : ''}run ${runId} on ${name} (org=${subdomain})`);
    return { success: true, message: failedOnly ? 'Failed jobs re-queued.' : 'Run re-queued.' };
  }

  // Deletes a run and its logs. Gitea exposes no cancel endpoint at any version we support, so a
  // queued or running run can only be deleted, not stopped.
  async removeRun(subdomain: string, name: string, runId: number): Promise<SuccessResponseDto> {
    await this.gitea.requireMinVersion(RUNS_MIN_VERSION, RUNS_FEATURE);
    const base = await this.repoBase(subdomain, name);

    await this.gitea.delete<void>(`${base}/actions/runs/${runId}`);

    this.logger.log(`Deleted run ${runId} on ${name} (org=${subdomain})`);
    return { success: true, message: 'Run deleted successfully.' };
  }
}
