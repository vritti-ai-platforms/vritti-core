import { ApiPropertyOptional } from '@nestjs/swagger';
import { Trim } from '@vritti/api-sdk/decorators';
import { IsBoolean, IsDateString, IsIn, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

const PARTY_LICENSE_TYPES = ['DRUG', 'EXCISE', 'FSSAI', 'OTHER'] as const;
type PartyLicenseTypeValue = (typeof PARTY_LICENSE_TYPES)[number];

export class UpdateCompanyLicenseDto {
  @ApiPropertyOptional({ description: 'License type', enum: PARTY_LICENSE_TYPES })
  @IsOptional()
  @IsIn(PARTY_LICENSE_TYPES)
  licenseType?: PartyLicenseTypeValue;

  @Trim({ nullify: false })
  @ApiPropertyOptional({ description: 'License number', example: 'DL-20B-123456' })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  licenseNumber?: string;

  @Trim()
  @ApiPropertyOptional({ description: 'Region or state the license covers', nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  region?: string | null;

  @ApiPropertyOptional({ description: 'License expiry date (ISO date)', nullable: true })
  @IsOptional()
  @IsDateString()
  validTo?: string | null;

  @Trim()
  @ApiPropertyOptional({ description: 'Additional notes', nullable: true })
  @IsOptional()
  @IsString()
  notes?: string | null;

  @ApiPropertyOptional({ description: 'Whether the license is active' })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
