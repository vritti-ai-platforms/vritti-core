import { Trim } from '@vritti/api-sdk/decorators';
import { IsBoolean, IsDateString, IsIn, IsNotEmpty, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';
import { type PartyLicenseType, partyLicenseTypeEnum } from '@/db/schema';

export class UpdateCompanyLicenseDto {
  @IsUUID()
  id: string;

  @IsOptional()
  @IsIn(partyLicenseTypeEnum.enumValues)
  licenseType?: PartyLicenseType;

  @Trim({ nullify: false })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  licenseNumber?: string;

  @Trim()
  @IsOptional()
  @IsString()
  @MaxLength(120)
  region?: string | null;

  @IsOptional()
  @IsDateString()
  validTo?: string | null;

  @Trim()
  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string | null;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
