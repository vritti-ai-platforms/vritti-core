import { Injectable, Logger } from '@nestjs/common';
import { DataTableStateService } from '@vritti/api-sdk/data-table';
import type { SuccessResponseDto } from '@vritti/api-sdk/database';
import { OrganizationGatewayService } from '../../organization/services/organization-gateway.service';
import { GiteaHttpService } from '../../services/gitea-http.service';
import { toGiteaFilters, toGiteaPaging } from '../../table-state.util';
import type { DispatchWorkflowDto } from '../dto/request/dispatch-workflow.dto';
import type { ListRunsQueryDto } from '../dto/request/list-runs-query.dto';
import { type GiteaApiJobList, JobListResponseDto } from '../dto/response/job-list-response.dto';
import { JobLogsResponseDto } from '../dto/response/job-logs-response.dto';
import {
  type GiteaApiRun,
  type GiteaApiRunList,
  RunListResponseDto,
  RunResponseDto,
} from '../dto/response/run-response.dto';
import type { RunTableResponseDto } from '../dto/response/run-table-response.dto';
import { type GiteaApiWorkflowList, WorkflowListResponseDto } from '../dto/response/workflow-list-response.dto';

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 20;

// Must match the slug the frontend table registers under, or the two read different Redis keys
const RUNS_TABLE_SLUG = 'gitea-org-action-runs';

// The only run fields Gitea will filter on. A filter on anything else is round-tripped, not applied.
const GITEA_RUN_FILTERS = ['event', 'branch', 'status', 'actor'] as const;

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

    // Gitea has a dedicated per-workflow runs endpoint; the unscoped one covers the rest
    const path = workflowId
      ? `${base}/actions/workflows/${encodeURIComponent(workflowId)}/runs`
      : `${base}/actions/runs`;

    const response = await this.gitea.getWithHeaders<GiteaApiRunList>(path, {
      params: { page, limit, ...toGiteaFilters(state, GITEA_RUN_FILTERS) },
    });

    const runs = response.data?.workflow_runs ?? [];
    const total = response.data?.total_count ?? runs.length;

    return { result: runs.map(RunResponseDto.from), count: total, state, activeViewId };
  }

  // Lists workflow runs, optionally scoped to one workflow file
  async listRuns(subdomain: string, name: string, query: ListRunsQueryDto): Promise<RunListResponseDto> {
    const base = await this.repoBase(subdomain, name);

    // Gitea has a dedicated per-workflow runs endpoint; the unscoped one covers the rest
    const path = query.workflowId
      ? `${base}/actions/workflows/${encodeURIComponent(query.workflowId)}/runs`
      : `${base}/actions/runs`;

    const response = await this.gitea.getOrNull<GiteaApiRunList>(path, {
      params: {
        page: query.page ?? DEFAULT_PAGE,
        limit: query.limit ?? DEFAULT_LIMIT,
        ...(query.event ? { event: query.event } : {}),
        ...(query.branch ? { branch: query.branch } : {}),
        ...(query.status ? { status: query.status } : {}),
        ...(query.actor ? { actor: query.actor } : {}),
      },
    });

    return RunListResponseDto.from(response);
  }

  // Returns a single run
  async findRun(subdomain: string, name: string, runId: number): Promise<RunResponseDto> {
    const base = await this.repoBase(subdomain, name);

    const run = await this.gitea.get<GiteaApiRun>(`${base}/actions/runs/${runId}`);

    return RunResponseDto.from(run);
  }

  // Returns the jobs of a run, each with its steps
  async listRunJobs(subdomain: string, name: string, runId: number): Promise<JobListResponseDto> {
    const base = await this.repoBase(subdomain, name);

    const response = await this.gitea.getOrNull<GiteaApiJobList>(`${base}/actions/runs/${runId}/jobs`);

    return JobListResponseDto.from(response);
  }

  // Returns a job's log output.
  // Gitea answers text/plain here even though its OpenAPI spec declares application/json, so the call
  // opts out of axios' JSON parsing.
  async getJobLogs(subdomain: string, name: string, jobId: number): Promise<JobLogsResponseDto> {
    const base = await this.repoBase(subdomain, name);

    const content = await this.gitea.getOrNull<string>(`${base}/actions/jobs/${jobId}/logs`, {
      responseType: 'text',
    });

    // A queued job has produced nothing yet, which Gitea reports as a 404
    return JobLogsResponseDto.from(content ?? '');
  }

  // Re-runs a whole run, or only the jobs that failed
  async rerun(subdomain: string, name: string, runId: number, failedOnly: boolean): Promise<SuccessResponseDto> {
    const base = await this.repoBase(subdomain, name);
    const path = failedOnly ? 'rerun-failed-jobs' : 'rerun';

    await this.gitea.post<void>(`${base}/actions/runs/${runId}/${path}`);

    this.logger.log(`Re-ran ${failedOnly ? 'failed jobs of ' : ''}run ${runId} on ${name} (org=${subdomain})`);
    return { success: true, message: failedOnly ? 'Failed jobs re-queued.' : 'Run re-queued.' };
  }

  // Deletes a run and its logs. Note Gitea 1.27 exposes no cancel endpoint — a queued or running run
  // can only be deleted, not stopped.
  async removeRun(subdomain: string, name: string, runId: number): Promise<SuccessResponseDto> {
    const base = await this.repoBase(subdomain, name);

    await this.gitea.delete<void>(`${base}/actions/runs/${runId}`);

    this.logger.log(`Deleted run ${runId} on ${name} (org=${subdomain})`);
    return { success: true, message: 'Run deleted successfully.' };
  }
}
