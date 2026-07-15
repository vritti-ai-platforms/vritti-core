import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import type { ScopeType } from '@vritti/api-sdk/catalog-resolver';
import { SelectOptionsQueryDto } from '@vritti/api-sdk/database';
import { IsIn, IsOptional, IsUUID } from 'class-validator';

export class SelectRolesInternalDto extends SelectOptionsQueryDto {
  @ApiProperty({ description: 'Exact assignment scope to match', example: 'SITE' })
  @IsIn(['ORG', 'LE', 'SITE_GROUP', 'SITE'])
  scope: ScopeType;

  @ApiPropertyOptional({
    description: "Target site ID — resolves the site's type for SITE scope",
    example: 'uuid-here',
  })
  @IsOptional()
  @IsUUID()
  siteId?: string;
}
