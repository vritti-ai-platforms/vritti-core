import { Trim } from '@vritti/api-sdk/decorators';
import {
  IsBoolean,
  IsIn,
  IsISO31661Alpha2,
  IsOptional,
  IsString,
  IsUppercase,
  IsUUID,
  MaxLength,
} from 'class-validator';
import { type TaxAuthorityLevel, taxAuthorityLevelEnum } from '@/db/schema';

export class UpdateTaxComponentDto {
  @IsUUID('7')
  id: string;

  @IsOptional()
  @IsISO31661Alpha2()
  @IsUppercase()
  countryCode?: string;

  @Trim({ nullify: false })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  name?: string;

  @IsOptional()
  @IsIn(taxAuthorityLevelEnum.enumValues)
  authorityLevel?: TaxAuthorityLevel;

  @IsOptional()
  @IsUUID('7')
  standsInForId?: string | null;

  @IsOptional()
  @IsBoolean()
  isRecoverable?: boolean;

  @IsOptional()
  @IsBoolean()
  isWithholding?: boolean;
}
