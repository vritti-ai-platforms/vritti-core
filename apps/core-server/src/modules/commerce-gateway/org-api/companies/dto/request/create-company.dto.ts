import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Trim } from '@vritti/api-sdk/decorators';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { CompanyAddressInputDto } from './company-address-input.dto';

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

  @ApiPropertyOptional({ type: CompanyAddressInputDto, description: 'Primary (registered) address' })
  @IsOptional()
  @ValidateNested()
  @Type(() => CompanyAddressInputDto)
  address?: CompanyAddressInputDto;

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
