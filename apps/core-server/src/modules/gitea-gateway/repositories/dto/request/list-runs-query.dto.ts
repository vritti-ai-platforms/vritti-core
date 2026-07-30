import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';

// Gitea's own run statuses. `completed` is terminal and carries a separate conclusion.
export const RUN_STATUSES = ['waiting', 'queued', 'running', 'completed'] as const;

export class ListRunsQueryDto {
  @ApiPropertyOptional({ default: 1, description: 'One-based page number' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ default: 20, description: 'Page size (Gitea caps a page at 50)' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  limit?: number;

  @ApiPropertyOptional({ example: 'workflow_dispatch', description: 'Trigger event, e.g. push or workflow_dispatch' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  event?: string;

  @ApiPropertyOptional({ example: 'main' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  branch?: string;

  @ApiPropertyOptional({ enum: RUN_STATUSES })
  @IsOptional()
  @IsIn(RUN_STATUSES)
  status?: (typeof RUN_STATUSES)[number];

  @ApiPropertyOptional({ example: 'vritti-admin', description: 'Gitea username that triggered the run' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  actor?: string;

  @ApiPropertyOptional({ example: 'ci.yaml', description: 'Restrict to one workflow file' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  workflowId?: string;
}
