import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsUUID } from 'class-validator';
import { AssignmentTypeValues } from '@/db/schema';

export class AssignRoleInternalDto {
  @ApiProperty({ description: 'Role ID', example: 'uuid-here' })
  @IsUUID()
  roleId: string;

  @ApiPropertyOptional({
    description: 'Target site ID (at most one target; all omitted = org-wide)',
    example: 'uuid-here',
  })
  @IsOptional()
  @IsUUID()
  siteId?: string;

  @ApiPropertyOptional({
    description: 'Target site group ID (covers member sites incl. future ones)',
    example: 'uuid-here',
  })
  @IsOptional()
  @IsUUID()
  siteGroupId?: string;

  @ApiPropertyOptional({ description: "Target legal entity ID (covers all the entity's sites)", example: 'uuid-here' })
  @IsOptional()
  @IsUUID()
  legalEntityId?: string;

  @ApiPropertyOptional({
    description: 'Assignment type',
    enum: ['DIRECT', 'INHERITED'],
    example: 'DIRECT',
  })
  @IsOptional()
  @IsEnum(AssignmentTypeValues)
  assignmentType?: string;
}
