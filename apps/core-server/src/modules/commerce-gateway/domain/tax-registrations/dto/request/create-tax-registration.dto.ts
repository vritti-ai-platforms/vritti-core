import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Trim } from '@vritti/api-sdk/decorators';
import { IsBoolean, IsEnum, IsNotEmpty, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

const REGISTRATION_TYPES = ['GSTIN', 'VAT', 'TIN', 'PAN', 'OTHER'] as const;

export class CreateTaxRegistrationDto {
  @ApiPropertyOptional({ description: 'Cloud names the entity; VAP takes it from the workspace header' })
  @IsOptional()
  @IsUUID()
  legalEntityId?: string;

  @ApiProperty({ description: 'Where the entity is registered — drives origin for tax resolution' })
  @IsUUID()
  jurisdictionId: string;

  @ApiProperty({ example: '36ABCDE1234F1Z5' })
  @Trim({ nullify: false })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  registrationNumber: string;

  @ApiProperty({ enum: REGISTRATION_TYPES })
  @IsEnum(REGISTRATION_TYPES)
  registrationType: (typeof REGISTRATION_TYPES)[number];

  @ApiPropertyOptional({ description: 'At most one per legal entity; setting this clears the others' })
  @IsOptional()
  @IsBoolean()
  isPrimary?: boolean;
}
