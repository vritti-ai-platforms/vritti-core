import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsInt, IsNotEmpty, IsOptional, IsString, IsUUID, Min } from 'class-validator';
import { SITE_GROUP_COLOR_KEYS } from '../../site-group-colors';

export class CreateSiteGroupInternalDto {
  @ApiProperty({ description: 'Organization ID', example: 'uuid-here' })
  @IsUUID()
  orgId: string;

  @ApiProperty({ description: 'Site group name', example: 'South Zone' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ description: 'Site group code (unique per organization)', example: 'south-zone' })
  @IsString()
  @IsNotEmpty()
  code: string;

  @ApiPropertyOptional({ description: 'Color key tag', example: 'blue', enum: SITE_GROUP_COLOR_KEYS })
  @IsOptional()
  @IsString()
  @IsIn(SITE_GROUP_COLOR_KEYS)
  color?: string;

  @ApiPropertyOptional({ description: 'Parent site group ID', example: 'uuid-here' })
  @IsOptional()
  @IsUUID()
  parentId?: string;

  @ApiPropertyOptional({ description: 'Sort order in the org-structure graph (lower sorts first)', example: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;
}
