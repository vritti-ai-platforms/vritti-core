import { ApiPropertyOptional } from '@nestjs/swagger';
import type { FeatureUnlocks, RevokedGrants, ScopeType, SiteType } from '@vritti/api-sdk/catalog-resolver';
import { Transform } from 'class-transformer';
import { Allow, IsIn, IsOptional, IsString } from 'class-validator';

export class UpdateRoleInternalDto {
  @ApiPropertyOptional({ example: 'Inventory Manager' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ example: 'Can manage all inventory operations' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Assignment scope; resolved from the template when absent', example: 'SITE' })
  @IsOptional()
  @IsIn(['ORG', 'LE', 'SITE_GROUP', 'SITE'])
  scope?: ScopeType;

  @ApiPropertyOptional({
    description: 'Site type for SITE-scoped roles; resolved from the template',
    example: 'OUTLET',
  })
  @IsOptional()
  @IsIn(['OUTLET', 'WAREHOUSE', 'PRODUCTION'])
  siteType?: SiteType;

  @ApiPropertyOptional({ example: { products: ['VIEW', 'CREATE'] } })
  @IsOptional()
  @Allow()
  @Transform(({ value }) => value, { toClassOnly: true })
  features?: FeatureUnlocks;

  @ApiPropertyOptional({ example: { products: { web: ['DELETE'], mobile: null } } })
  @IsOptional()
  @Allow()
  @Transform(({ value }) => value, { toClassOnly: true })
  revoked?: RevokedGrants;
}
