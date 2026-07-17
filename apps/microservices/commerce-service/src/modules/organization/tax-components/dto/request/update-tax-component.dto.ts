import { Trim } from '@vritti/api-sdk/decorators';
import { IsBoolean, IsIn, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';
import { type TaxAuthorityLevel, taxAuthorityLevelEnum } from '@/db/schema';

export class UpdateTaxComponentDto {
  @IsUUID()
  id: string;

  @Trim({ nullify: false })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  name?: string;

  @IsOptional()
  @IsIn(taxAuthorityLevelEnum.enumValues)
  authorityLevel?: TaxAuthorityLevel;

  @IsOptional()
  @IsBoolean()
  isRecoverable?: boolean;

  @IsOptional()
  @IsBoolean()
  isWithholding?: boolean;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
