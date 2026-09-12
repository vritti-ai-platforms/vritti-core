import { ApiPropertyOptional } from '@nestjs/swagger';
import { Trim } from '@vritti/api-sdk/decorators';
import { IsBoolean, IsEnum, IsNotEmpty, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

const REGISTRATION_TYPES = ['GSTIN', 'VAT', 'TIN', 'PAN', 'OTHER'] as const;

export class UpdateTaxRegistrationDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  jurisdictionId?: string;

  @ApiPropertyOptional({ example: '36ABCDE1234F1Z5' })
  @IsOptional()
  @Trim({ nullify: false })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  registrationNumber?: string;

  @ApiPropertyOptional({ enum: REGISTRATION_TYPES })
  @IsOptional()
  @IsEnum(REGISTRATION_TYPES)
  registrationType?: (typeof REGISTRATION_TYPES)[number];

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isPrimary?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
