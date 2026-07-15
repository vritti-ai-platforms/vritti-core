import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsIn, IsInt, IsNotEmpty, IsOptional, IsString, IsUUID, Min, ValidateIf } from 'class-validator';
import { SITE_GROUP_COLOR_KEYS } from '../../site-group-colors';

export class UpdateSiteGroupInternalDto {
  @ApiPropertyOptional({ example: 'South Zone' })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  name?: string;

  @ApiPropertyOptional({ example: 'south-zone' })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  code?: string;

  @ApiPropertyOptional({
    description: 'Color key tag; null clears the color',
    example: 'blue',
    enum: SITE_GROUP_COLOR_KEYS,
    nullable: true,
  })
  @IsOptional()
  @ValidateIf((o) => o.color !== null)
  @IsIn(SITE_GROUP_COLOR_KEYS)
  color?: string | null;

  @ApiPropertyOptional({
    description: 'Parent site group ID; null makes the group a root',
    example: 'uuid-here',
    nullable: true,
  })
  @IsOptional()
  @ValidateIf((o) => o.parentId !== null)
  @IsUUID()
  parentId?: string | null;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ description: 'Sort order in the org-structure graph (lower sorts first)', example: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;
}
