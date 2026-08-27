import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Logger,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AuthType, Require, UserId } from '@vritti/api-sdk/auth';
import type { CreateResponseDto, SuccessResponseDto } from '@vritti/api-sdk/database';
import { ORG_REPOSITORIES } from '@vritti/gitea-permissions/repository';
import { SessionTypeValues } from '@/db/schema';
import { RequireFeature, RequirePermission } from '@/rbac/decorators';
import { OrgSubdomain } from '@/security/decorators';
import { CreateRepositoryDto } from './dto/request/create-repository.dto';
import { DispatchWorkflowDto } from './dto/request/dispatch-workflow.dto';
import { RepositoryContentsQueryDto } from './dto/request/repository-contents-query.dto';
import type { BranchListResponseDto } from './dto/response/branch-list-response.dto';
import type { JobListResponseDto } from './dto/response/job-list-response.dto';
import type { JobLogsResponseDto } from './dto/response/job-logs-response.dto';
import type { RepositoryContentsResponseDto } from './dto/response/repository-contents-response.dto';
import type { RepositoryResponseDto } from './dto/response/repository-response.dto';
import type { RepositoryStatsResponseDto } from './dto/response/repository-stats-response.dto';
import type { RepositoryTableResponseDto } from './dto/response/repository-table-response.dto';
import type { RunResponseDto } from './dto/response/run-response.dto';
import type { RunTableResponseDto } from './dto/response/run-table-response.dto';
import type { WorkflowListResponseDto } from './dto/response/workflow-list-response.dto';
import { ActionsGatewayService } from './services/actions-gateway.service';
import { RepositoriesGatewayService } from './services/repositories-gateway.service';

// Actions are not a separate feature — they are a view of a repository — so every route lives here and
// shares the repositories feature. Permissions split by what the route actually does rather than by verb:
// the repository record is CRUD (`view`/`add`/`edit`/`delete`), browsing source is `code.view`, and the
// actions routes are executions, split by lifecycle stage. The definitions are `actions.workflows.*` —
// `dispatch` starts one on a caller-chosen ref, `configure` enables or disables it org-wide. The
// executions are `actions.runs.*` — `rerun` replays one, `delete` removes it (Gitea has no cancel, so
// that is also the only way to stop one).
// Job logs are `logs.view` of their own: the endpoint is job-scoped rather than run-scoped, and CI output
// routinely carries secrets and internal hostnames.
//
// Route order matters within a path depth: a static segment must be declared before a dynamic one at the
// same position, or the parameter swallows it. Hence `table` before `:name`, and `runs/table` before
// `runs/:runId`.
@ApiTags('Gitea - Repositories')
@ApiBearerAuth()
@Require(AuthType.Session, SessionTypeValues.WEB)
@RequireFeature(ORG_REPOSITORIES.featureCode)
@Controller('repositories')
export class RepositoriesGatewayController {
  private readonly logger = new Logger(RepositoriesGatewayController.name);

  constructor(
    private readonly repositoriesGatewayService: RepositoriesGatewayService,
    private readonly actionsGatewayService: ActionsGatewayService,
  ) {}

  // Canonical DataTable endpoint: view state comes from Redis rather than the query string
  @Get('table')
  @RequirePermission(ORG_REPOSITORIES.view)
  findForTable(@UserId() userId: string, @OrgSubdomain() subdomain: string): Promise<RepositoryTableResponseDto> {
    this.logger.log(`GET /gitea-api/repositories/table (org=${subdomain})`);
    return this.repositoriesGatewayService.findForTable(userId, subdomain);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @RequirePermission(ORG_REPOSITORIES.add)
  create(
    @OrgSubdomain() subdomain: string,
    @Body() dto: CreateRepositoryDto,
  ): Promise<CreateResponseDto<RepositoryResponseDto>> {
    this.logger.log(`POST /gitea-api/repositories (org=${subdomain}, name=${dto.name})`);
    return this.repositoriesGatewayService.create(subdomain, dto);
  }

  // --- Actions: workflows -------------------------------------------------------------------------

  @Get(':name/actions/workflows')
  @RequirePermission(ORG_REPOSITORIES.actions.workflows.view)
  listWorkflows(@OrgSubdomain() subdomain: string, @Param('name') name: string): Promise<WorkflowListResponseDto> {
    this.logger.log(`GET /gitea-api/repositories/${name}/actions/workflows (org=${subdomain})`);
    return this.actionsGatewayService.listWorkflows(subdomain, name);
  }

  @Post(':name/actions/workflows/:workflowId/dispatches')
  @RequirePermission(ORG_REPOSITORIES.actions.workflows.dispatch)
  dispatchWorkflow(
    @OrgSubdomain() subdomain: string,
    @Param('name') name: string,
    @Param('workflowId') workflowId: string,
    @Body() dto: DispatchWorkflowDto,
  ): Promise<RunResponseDto | null> {
    this.logger.log(`POST /gitea-api/repositories/${name}/actions/workflows/${workflowId}/dispatches`);
    return this.actionsGatewayService.dispatchWorkflow(subdomain, name, workflowId, dto);
  }

  @Put(':name/actions/workflows/:workflowId/enable')
  @RequirePermission(ORG_REPOSITORIES.actions.workflows.configure)
  enableWorkflow(
    @OrgSubdomain() subdomain: string,
    @Param('name') name: string,
    @Param('workflowId') workflowId: string,
  ): Promise<SuccessResponseDto> {
    this.logger.log(`PUT /gitea-api/repositories/${name}/actions/workflows/${workflowId}/enable`);
    return this.actionsGatewayService.setWorkflowEnabled(subdomain, name, workflowId, true);
  }

  @Put(':name/actions/workflows/:workflowId/disable')
  @RequirePermission(ORG_REPOSITORIES.actions.workflows.configure)
  disableWorkflow(
    @OrgSubdomain() subdomain: string,
    @Param('name') name: string,
    @Param('workflowId') workflowId: string,
  ): Promise<SuccessResponseDto> {
    this.logger.log(`PUT /gitea-api/repositories/${name}/actions/workflows/${workflowId}/disable`);
    return this.actionsGatewayService.setWorkflowEnabled(subdomain, name, workflowId, false);
  }

  // --- Actions: runs, jobs and logs --------------------------------------------------------------

  @Get(':name/actions/runs/table')
  @RequirePermission(ORG_REPOSITORIES.actions.runs.view)
  findRunsForTable(
    @UserId() userId: string,
    @OrgSubdomain() subdomain: string,
    @Param('name') name: string,
    @Query('workflowId') workflowId?: string,
  ): Promise<RunTableResponseDto> {
    this.logger.log(`GET /gitea-api/repositories/${name}/actions/runs/table (workflow=${workflowId ?? 'all'})`);
    return this.actionsGatewayService.findRunsForTable(userId, subdomain, name, workflowId);
  }

  @Get(':name/actions/runs/:runId')
  @RequirePermission(ORG_REPOSITORIES.actions.runs.view)
  findRun(
    @OrgSubdomain() subdomain: string,
    @Param('name') name: string,
    @Param('runId', ParseIntPipe) runId: number,
  ): Promise<RunResponseDto> {
    this.logger.log(`GET /gitea-api/repositories/${name}/actions/runs/${runId}`);
    return this.actionsGatewayService.findRun(subdomain, name, runId);
  }

  @Get(':name/actions/runs/:runId/jobs')
  @RequirePermission(ORG_REPOSITORIES.actions.runs.view)
  listRunJobs(
    @OrgSubdomain() subdomain: string,
    @Param('name') name: string,
    @Param('runId', ParseIntPipe) runId: number,
  ): Promise<JobListResponseDto> {
    this.logger.log(`GET /gitea-api/repositories/${name}/actions/runs/${runId}/jobs`);
    return this.actionsGatewayService.listRunJobs(subdomain, name, runId);
  }

  @Get(':name/actions/jobs/:jobId/logs')
  @RequirePermission(ORG_REPOSITORIES.logs.view)
  getJobLogs(
    @OrgSubdomain() subdomain: string,
    @Param('name') name: string,
    @Param('jobId', ParseIntPipe) jobId: number,
  ): Promise<JobLogsResponseDto> {
    this.logger.log(`GET /gitea-api/repositories/${name}/actions/jobs/${jobId}/logs`);
    return this.actionsGatewayService.getJobLogs(subdomain, name, jobId);
  }

  @Post(':name/actions/runs/:runId/rerun')
  @RequirePermission(ORG_REPOSITORIES.actions.runs.rerun)
  rerun(
    @OrgSubdomain() subdomain: string,
    @Param('name') name: string,
    @Param('runId', ParseIntPipe) runId: number,
  ): Promise<SuccessResponseDto> {
    this.logger.log(`POST /gitea-api/repositories/${name}/actions/runs/${runId}/rerun`);
    return this.actionsGatewayService.rerun(subdomain, name, runId, false);
  }

  @Post(':name/actions/runs/:runId/rerun-failed-jobs')
  @RequirePermission(ORG_REPOSITORIES.actions.runs.rerun)
  rerunFailedJobs(
    @OrgSubdomain() subdomain: string,
    @Param('name') name: string,
    @Param('runId', ParseIntPipe) runId: number,
  ): Promise<SuccessResponseDto> {
    this.logger.log(`POST /gitea-api/repositories/${name}/actions/runs/${runId}/rerun-failed-jobs`);
    return this.actionsGatewayService.rerun(subdomain, name, runId, true);
  }

  @Delete(':name/actions/runs/:runId')
  @RequirePermission(ORG_REPOSITORIES.actions.runs.delete)
  removeRun(
    @OrgSubdomain() subdomain: string,
    @Param('name') name: string,
    @Param('runId', ParseIntPipe) runId: number,
  ): Promise<SuccessResponseDto> {
    this.logger.log(`DELETE /gitea-api/repositories/${name}/actions/runs/${runId}`);
    return this.actionsGatewayService.removeRun(subdomain, name, runId);
  }

  // --- Repository detail -------------------------------------------------------------------------

  @Get(':name/stats')
  @RequirePermission(ORG_REPOSITORIES.code.view)
  getStats(
    @OrgSubdomain() subdomain: string,
    @Param('name') name: string,
    @Query('ref') ref?: string,
  ): Promise<RepositoryStatsResponseDto> {
    this.logger.log(`GET /gitea-api/repositories/${name}/stats (org=${subdomain}, ref=${ref ?? 'default'})`);
    return this.repositoriesGatewayService.getStats(subdomain, name, ref);
  }

  // Stays on `view`, not `code.view`: the dispatch dialog populates its ref picker from this, so a user
  // with actions.dispatch but no Code-tab access would otherwise have no branch to run against
  @Get(':name/branches')
  @RequirePermission(ORG_REPOSITORIES.view)
  listBranches(@OrgSubdomain() subdomain: string, @Param('name') name: string): Promise<BranchListResponseDto> {
    this.logger.log(`GET /gitea-api/repositories/${name}/branches (org=${subdomain})`);
    return this.repositoriesGatewayService.listBranches(subdomain, name);
  }

  @Get(':name/contents')
  @RequirePermission(ORG_REPOSITORIES.code.view)
  getContents(
    @OrgSubdomain() subdomain: string,
    @Param('name') name: string,
    @Query() query: RepositoryContentsQueryDto,
  ): Promise<RepositoryContentsResponseDto> {
    this.logger.log(`GET /gitea-api/repositories/${name}/contents (org=${subdomain}, path=${query.path ?? ''})`);
    return this.repositoriesGatewayService.getContents(subdomain, name, query);
  }

  @Get(':name')
  @RequirePermission(ORG_REPOSITORIES.view)
  findOne(@OrgSubdomain() subdomain: string, @Param('name') name: string): Promise<RepositoryResponseDto> {
    this.logger.log(`GET /gitea-api/repositories/${name} (org=${subdomain})`);
    return this.repositoriesGatewayService.findOne(subdomain, name);
  }

  @Delete(':name')
  @RequirePermission(ORG_REPOSITORIES.delete)
  remove(@OrgSubdomain() subdomain: string, @Param('name') name: string): Promise<SuccessResponseDto> {
    this.logger.log(`DELETE /gitea-api/repositories/${name} (org=${subdomain})`);
    return this.repositoriesGatewayService.remove(subdomain, name);
  }
}
