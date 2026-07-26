import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Trim } from '@vritti/api-sdk/decorators';
import { IsBoolean, IsIn, IsNotEmpty, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

const TAX_REGISTRATION_TYPES = ['GSTIN', 'VAT', 'TIN', 'PAN', 'OTHER'] as const;
type TaxRegistrationTypeValue = (typeof TAX_REGISTRATION_TYPES)[number];

export class CreatePersonRegistrationDto {
  @ApiProperty({ description: 'Tax jurisdiction ID the registration belongs to' })
  @IsUUID()
  jurisdictionId: string;

  @Trim({ nullify: false })
  @ApiProperty({ description: 'Registration number', example: '22AAAAA0000A1Z5' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  registrationNumber: string;

  @ApiProperty({ description: 'Registration type', enum: TAX_REGISTRATION_TYPES })
  @IsIn(TAX_REGISTRATION_TYPES)
  registrationType: TaxRegistrationTypeValue;

  @ApiPropertyOptional({ description: 'Whether this is the primary registration' })
  @IsOptional()
  @IsBoolean()
  isPrimary?: boolean;

  @ApiPropertyOptional({ description: 'Whether the registration is active', default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
