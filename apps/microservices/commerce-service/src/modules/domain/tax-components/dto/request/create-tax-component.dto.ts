import { IsCode, Trim } from '@vritti/api-sdk/decorators';
import {
  IsBoolean,
  IsIn,
  IsISO31661Alpha2,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUppercase,
  IsUUID,
  MaxLength,
} from 'class-validator';
import { type TaxAuthorityLevel, taxAuthorityLevelEnum } from '@/db/schema';

export class CreateTaxComponentDto {
  @IsISO31661Alpha2()
  @IsUppercase()
  countryCode: string;

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

  @IsIn(taxAuthorityLevelEnum.enumValues)
  authorityLevel: TaxAuthorityLevel;

  @IsOptional()
  @IsUUID('7')
  standsInForId?: string | null;

  @IsBoolean()
  isRecoverable: boolean;

  @IsBoolean()
  isWithholding: boolean;

  @IsBoolean()
  isActive: boolean;
}
