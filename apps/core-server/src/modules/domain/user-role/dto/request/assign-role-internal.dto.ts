import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsUUID } from 'class-validator';
import { AssignmentTypeValues } from '@/db/schema';

export class AssignRoleInternalDto {
  @ApiProperty({ description: 'Role ID', example: 'uuid-here' })
  @IsUUID('7')
  roleId: string;

  @ApiPropertyOptional({
    description: 'Target site ID (at most one target; all omitted = org-wide)',
    example: 'uuid-here',
  })
  @IsOptional()
  @IsUUID('7')
  siteId?: string;

  @ApiPropertyOptional({
    description: 'Target site group ID (covers member sites incl. future ones)',
    example: 'uuid-here',
  })
  @IsOptional()
  @IsUUID('7')
  siteGroupId?: string;

  @ApiPropertyOptional({ description: "Target legal entity ID (covers all the entity's sites)", example: 'uuid-here' })
  @IsOptional()
  @IsUUID('7')
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
