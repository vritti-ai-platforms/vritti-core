import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

// Non-terminal statuses. Anything else (in practice `completed`) carries a conclusion instead, which is
// what tells a caller whether polling can stop.
const ACTIVE_STATUSES = new Set(['waiting', 'queued', 'running']);

interface GiteaApiActor {
  login?: string | null;
  full_name?: string | null;
  avatar_url?: string | null;
}

// Raw run shape from Gitea. `path` arrives as `<workflow file>@<ref>`, e.g. `ci.yaml@refs/heads/main`.
export interface GiteaApiRun {
  id: number;
  run_number: number;
  display_title?: string | null;
  event: string;
  status: string;
  conclusion?: string | null;
  head_branch?: string | null;
  head_sha?: string | null;
  path?: string | null;
  run_attempt?: number | null;
  started_at?: string | null;
  completed_at?: string | null;
  html_url?: string | null;
  actor?: GiteaApiActor | null;
  trigger_actor?: GiteaApiActor | null;
}

export interface GiteaApiRunList {
  workflow_runs?: GiteaApiRun[] | null;
  total_count?: number;
}

export class RunResponseDto {
  @ApiProperty({ example: 12 })
  id: number;

  @ApiProperty({ example: 12, description: 'Sequential number shown as #12' })
  runNumber: number;

  @ApiProperty({ example: 'Long Run Test' })
  title: string;

  @ApiProperty({ example: 'workflow_dispatch' })
  event: string;

  @ApiProperty({ example: 'completed', enum: ['waiting', 'queued', 'running', 'completed'] })
  status: string;

  @ApiPropertyOptional({ example: 'success', description: 'Set once status is completed' })
  conclusion: string | null;

  @ApiProperty({ example: false, description: 'True while the run can still change — drives polling' })
  isActive: boolean;

  @ApiPropertyOptional({ example: 'long-run-test.yaml', description: 'Workflow file, parsed out of path' })
  workflowId: string | null;

  @ApiPropertyOptional({ example: 'main' })
  headBranch: string | null;

  @ApiPropertyOptional({ example: 'c37f3af27a130756dfcac4c8771be30589e15e58' })
  headSha: string | null;

  @ApiProperty({ example: 1 })
  runAttempt: number;

  @ApiPropertyOptional({ example: '2026-07-28T17:55:48Z' })
  startedAt: string | null;

  @ApiPropertyOptional({ example: '2026-07-28T17:58:48Z' })
  completedAt: string | null;

  @ApiPropertyOptional({ example: 'Shyam sunder', description: 'Who triggered the run' })
  actor: string | null;

  static from(run: GiteaApiRun): RunResponseDto {
    const dto = new RunResponseDto();
    dto.id = run.id;
    dto.runNumber = run.run_number;
    dto.title = run.display_title?.trim() || `Run #${run.run_number}`;
    dto.event = run.event;
    dto.status = run.status;
    dto.conclusion = run.conclusion?.trim() || null;
    dto.isActive = ACTIVE_STATUSES.has(run.status);
    // Gitea reports `<file>@<ref>`; only the file identifies the workflow
    dto.workflowId = run.path?.split('@')[0]?.trim() || null;
    dto.headBranch = run.head_branch?.trim() || null;
    dto.headSha = run.head_sha?.trim() || null;
    dto.runAttempt = run.run_attempt ?? 1;
    dto.startedAt = run.started_at ?? null;
    dto.completedAt = run.completed_at ?? null;
    dto.actor = run.trigger_actor?.full_name?.trim() || run.actor?.login?.trim() || null;
    return dto;
  }
}

export class RunListResponseDto {
  @ApiProperty({ type: [RunResponseDto] })
  items: RunResponseDto[];

  @ApiProperty({ example: 8 })
  total: number;

  static from(response: GiteaApiRunList | null): RunListResponseDto {
    const dto = new RunListResponseDto();
    const runs = response?.workflow_runs ?? [];
    dto.items = runs.map(RunResponseDto.from);
    dto.total = response?.total_count ?? runs.length;
    return dto;
  }
}
