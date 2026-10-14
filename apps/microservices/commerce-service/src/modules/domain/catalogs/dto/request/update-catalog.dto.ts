import { Trim } from '@vritti/api-sdk/decorators';
import { IsBoolean, IsIn, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';
import { type CatalogFilterMode, catalogFilterModeEnum } from '@/db/schema';

export class UpdateCatalogDto {
  @IsUUID('7')
  id: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  @Trim()
  name?: string;

  @IsOptional()
  @IsBoolean()
  taxInclusive?: boolean;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  // STATIC counts each filter value across the whole catalog; NARROWING applies the other selected groups
  @IsOptional()
  @IsIn(catalogFilterModeEnum.enumValues)
  filterMode?: CatalogFilterMode;
}
