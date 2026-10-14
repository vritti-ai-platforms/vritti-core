import { ApiPropertyOptional } from '@nestjs/swagger';
import { Trim } from '@vritti/api-sdk/decorators';
import { IsBoolean, IsIn, IsOptional, IsString, MaxLength } from 'class-validator';

// Mirrors commerce-service's catalog_filter_mode enum
export const CATALOG_FILTER_MODES = ['STATIC', 'NARROWING'] as const;
export type CatalogFilterMode = (typeof CATALOG_FILTER_MODES)[number];

export class UpdateCatalogDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(255)
  @Trim()
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  taxInclusive?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({
    enum: CATALOG_FILTER_MODES,
    description:
      'How storefront filter counts are computed: STATIC counts each value across the whole catalog; NARROWING counts it with the other selected groups applied',
  })
  @IsOptional()
  @IsIn(CATALOG_FILTER_MODES)
  filterMode?: CatalogFilterMode;
}
