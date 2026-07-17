import { IsCode, IsCountry, Trim } from '@vritti/api-sdk/decorators';
import { IsBoolean, IsIn, IsNotEmpty, IsOptional, IsString, IsUUID, Length, MaxLength } from 'class-validator';
import { type TaxJurisdictionLevel, taxJurisdictionLevelEnum } from '@/db/schema';

export class CreateTaxJurisdictionDto {
  @Trim({ nullify: false })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  @IsCode()
  code: string;

  @Trim({ nullify: false })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name: string;

  @IsIn(taxJurisdictionLevelEnum.enumValues)
  level: TaxJurisdictionLevel;

  @IsOptional()
  @IsUUID()
  parentId?: string;

  @IsCountry()
  countryCode: string;

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

  @IsBoolean()
  isActive: boolean;
}
