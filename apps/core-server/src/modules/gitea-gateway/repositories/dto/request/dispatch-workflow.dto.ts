import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsObject, IsOptional, IsString, Matches, MaxLength } from 'class-validator';

const REF_PATTERN = /^[A-Za-z0-9._\-/]+$/;

export class DispatchWorkflowDto {
  @ApiProperty({ example: 'main', description: 'Branch, tag or commit to run the workflow against' })
  @IsString()
  @MaxLength(255)
  @Matches(REF_PATTERN, { message: 'Letters, numbers, dots, underscores, hyphens, and slashes only' })
  ref: string;

  // Gitea exposes no input schema for a workflow, so nothing can build a form for these yet.
  @ApiPropertyOptional({ type: 'object', additionalProperties: { type: 'string' } })
  @IsOptional()
  @IsObject()
  inputs?: Record<string, string>;
}
