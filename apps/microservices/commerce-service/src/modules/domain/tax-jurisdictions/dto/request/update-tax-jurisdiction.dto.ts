import { IsCountry, Trim } from '@vritti/api-sdk/decorators';
import { IsBoolean, IsIn, IsOptional, IsString, IsUUID, Length, MaxLength } from 'class-validator';
import { type TaxJurisdictionLevel, taxJurisdictionLevelEnum } from '@/db/schema';

export class UpdateTaxJurisdictionDto {
  @IsUUID()
  id: string;

  @Trim({ nullify: false })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  name?: string;

  @IsOptional()
  @IsIn(taxJurisdictionLevelEnum.enumValues)
  level?: TaxJurisdictionLevel;

  @IsOptional()
  @IsUUID()
  parentId?: string;

  @IsOptional()
  @IsCountry()
  countryCode?: string;

  @Trim()
  @IsOptional()
  @IsString()
  @Length(1, 10)
  regionCode?: string | null;

  @Trim()
  @IsOptional()
  @IsString()
  @MaxLength(50)
  taxUnion?: string | null;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
