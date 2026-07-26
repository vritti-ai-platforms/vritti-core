import { ApiPropertyOptional } from '@nestjs/swagger';
import { Trim } from '@vritti/api-sdk/decorators';
import { IsBoolean, IsIn, IsNotEmpty, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

const TAX_REGISTRATION_TYPES = ['GSTIN', 'VAT', 'TIN', 'PAN', 'OTHER'] as const;
type TaxRegistrationTypeValue = (typeof TAX_REGISTRATION_TYPES)[number];

export class UpdatePersonRegistrationDto {
  @ApiPropertyOptional({ description: 'Tax jurisdiction ID the registration belongs to' })
  @IsOptional()
  @IsUUID()
  jurisdictionId?: string;

  @Trim({ nullify: false })
  @ApiPropertyOptional({ description: 'Registration number' })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  registrationNumber?: string;

  @ApiPropertyOptional({ description: 'Registration type', enum: TAX_REGISTRATION_TYPES })
  @IsOptional()
  @IsIn(TAX_REGISTRATION_TYPES)
  registrationType?: TaxRegistrationTypeValue;

  @ApiPropertyOptional({ description: 'Whether this is the primary registration' })
  @IsOptional()
  @IsBoolean()
  isPrimary?: boolean;

  @ApiPropertyOptional({ description: 'Whether the registration is active' })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
