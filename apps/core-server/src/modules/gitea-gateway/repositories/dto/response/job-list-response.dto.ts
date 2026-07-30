import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

const ACTIVE_STATUSES = new Set(['waiting', 'queued', 'running']);

interface GiteaApiStep {
  name: string;
  number: number;
  status: string;
  conclusion?: string | null;
  started_at?: string | null;
  completed_at?: string | null;
}

export interface GiteaApiJob {
  id: number;
  name: string;
  status: string;
  conclusion?: string | null;
  run_id: number;
  run_attempt?: number | null;
  runner_name?: string | null;
  started_at?: string | null;
  completed_at?: string | null;
  steps?: GiteaApiStep[] | null;
}

export interface GiteaApiJobList {
  jobs?: GiteaApiJob[] | null;
  total_count?: number;
}

export class JobStepResponseDto {
  @ApiProperty({ example: 'Checkout repository' })
  name: string;

  @ApiProperty({ example: 1 })
  number: number;

  @ApiProperty({ example: 'completed' })
  status: string;

  @ApiPropertyOptional({ example: 'success' })
  conclusion: string | null;

  @ApiPropertyOptional()
  startedAt: string | null;

  @ApiPropertyOptional()
  completedAt: string | null;

  static from(step: GiteaApiStep): JobStepResponseDto {
    const dto = new JobStepResponseDto();
    dto.name = step.name;
    dto.number = step.number;
    dto.status = step.status;
    dto.conclusion = step.conclusion?.trim() || null;
    dto.startedAt = step.started_at ?? null;
    dto.completedAt = step.completed_at ?? null;
    return dto;
  }
}

export class JobResponseDto {
  @ApiProperty({ example: 15 })
  id: number;

  @ApiProperty({ example: 'long-run' })
  name: string;

  @ApiProperty({ example: 'completed' })
  status: string;

  @ApiPropertyOptional({ example: 'success' })
  conclusion: string | null;

  @ApiProperty({ example: false, description: 'True while the job can still change — drives polling' })
  isActive: boolean;

  @ApiPropertyOptional({ example: 'mac-host-runner' })
  runnerName: string | null;

  @ApiPropertyOptional()
  startedAt: string | null;

  @ApiPropertyOptional()
  completedAt: string | null;

  // Steps carry status and timings only — Gitea holds no per-step output, so logs are fetched per job
  @ApiProperty({ type: [JobStepResponseDto] })
  steps: JobStepResponseDto[];

  static from(job: GiteaApiJob): JobResponseDto {
    const dto = new JobResponseDto();
    dto.id = job.id;
    dto.name = job.name;
    dto.status = job.status;
    dto.conclusion = job.conclusion?.trim() || null;
    dto.isActive = ACTIVE_STATUSES.has(job.status);
    dto.runnerName = job.runner_name?.trim() || null;
    dto.startedAt = job.started_at ?? null;
    dto.completedAt = job.completed_at ?? null;
    dto.steps = (job.steps ?? []).map(JobStepResponseDto.from);
    return dto;
  }
}

export class JobListResponseDto {
  @ApiProperty({ type: [JobResponseDto] })
  items: JobResponseDto[];

  static from(response: GiteaApiJobList | null): JobListResponseDto {
    const dto = new JobListResponseDto();
    dto.items = (response?.jobs ?? []).map(JobResponseDto.from);
    return dto;
  }
}
