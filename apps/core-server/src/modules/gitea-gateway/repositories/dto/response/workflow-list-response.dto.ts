import { ApiProperty } from '@nestjs/swagger';

export interface GiteaApiWorkflow {
  id: string;
  name: string;
  path: string;
  state: string;
  created_at: string;
  updated_at: string;
  html_url: string;
}

export interface GiteaApiWorkflowList {
  workflows?: GiteaApiWorkflow[] | null;
  total_count?: number;
}

export class WorkflowResponseDto {
  @ApiProperty({ example: 'ci.yaml', description: 'Workflow file name — the id Gitea addresses it by' })
  id: string;

  @ApiProperty({ example: 'CI' })
  name: string;

  @ApiProperty({ example: '.gitea/workflows/ci.yaml' })
  path: string;

  @ApiProperty({ example: 'active', description: 'active when enabled, otherwise a disabled_* variant' })
  state: string;

  @ApiProperty({ example: true, description: 'Derived from state — true when the workflow is enabled' })
  isActive: boolean;

  @ApiProperty({ example: '2026-07-28T03:36:29+05:30' })
  updatedAt: string;

  static from(workflow: GiteaApiWorkflow): WorkflowResponseDto {
    const dto = new WorkflowResponseDto();
    dto.id = workflow.id;
    dto.name = workflow.name;
    dto.path = workflow.path;
    dto.state = workflow.state;
    dto.isActive = workflow.state === 'active';
    dto.updatedAt = workflow.updated_at;
    return dto;
  }
}

export class WorkflowListResponseDto {
  @ApiProperty({ type: [WorkflowResponseDto] })
  items: WorkflowResponseDto[];

  static from(response: GiteaApiWorkflowList | null): WorkflowListResponseDto {
    const dto = new WorkflowListResponseDto();
    dto.items = (response?.workflows ?? []).map(WorkflowResponseDto.from);
    return dto;
  }
}
