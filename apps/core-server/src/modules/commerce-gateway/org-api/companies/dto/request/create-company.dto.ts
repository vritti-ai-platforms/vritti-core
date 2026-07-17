import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Trim } from '@vritti/api-sdk/decorators';
import { IsBoolean, IsEmail, IsNotEmpty, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export class CreateCompanyDto {
  @Trim({ nullify: false })
  @ApiProperty({ description: 'Human-readable display name', example: 'Acme Corp' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  displayName: string;

  @Trim()
  @ApiPropertyOptional({ description: 'Registered legal name', example: 'Acme Corporation Pvt Ltd' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  legalName?: string | null;

  @Trim()
  @ApiPropertyOptional({ description: 'Primary email address' })
  @IsOptional()
  @IsEmail()
  @MaxLength(255)
  email?: string | null;

  @Trim()
  @ApiPropertyOptional({ description: 'Primary phone number' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  phone?: string | null;

  @Trim()
  @ApiPropertyOptional({ description: 'Mailing address' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  address?: string | null;

  @Trim()
  @ApiPropertyOptional({ description: 'Company website URL' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  website?: string | null;

  @ApiPropertyOptional({ description: 'Tax jurisdiction ID' })
  @IsOptional()
  @IsUUID()
  jurisdictionId?: string;

  @ApiProperty({ description: 'Whether the company is selectable' })
  @IsBoolean()
  isActive: boolean;
}
