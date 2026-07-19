import { IsCode, Trim } from '@vritti/api-sdk/decorators';
import { IsBoolean, IsIn, IsNotEmpty, IsString, MaxLength } from 'class-validator';
import { type TaxAuthorityLevel, taxAuthorityLevelEnum } from '@/db/schema';

export class CreateTaxComponentDto {
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

  @IsBoolean()
  isRecoverable: boolean;

  @IsBoolean()
  isWithholding: boolean;

  @IsBoolean()
  isActive: boolean;
}
