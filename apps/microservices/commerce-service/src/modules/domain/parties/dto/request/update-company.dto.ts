import { Trim } from '@vritti/api-sdk/decorators';
import { Type } from 'class-transformer';
import { IsBoolean, IsEmail, IsOptional, IsString, IsUUID, MaxLength, ValidateNested } from 'class-validator';
import { CompanyAddressInputDto } from './company-address-input.dto';

export class UpdateCompanyDto {
  @IsUUID()
  id: string;

  @Trim({ nullify: false })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  displayName?: string;

  @Trim()
  @IsOptional()
  @IsString()
  @MaxLength(255)
  legalName?: string | null;

  @Trim()
  @IsOptional()
  @IsEmail()
  @MaxLength(255)
  email?: string | null;

  @Trim()
  @IsOptional()
  @IsString()
  @MaxLength(20)
  phone?: string | null;

  @IsOptional()
  @ValidateNested()
  @Type(() => CompanyAddressInputDto)
  address?: CompanyAddressInputDto;

  @Trim()
  @IsOptional()
  @IsString()
  @MaxLength(255)
  website?: string | null;

  @IsOptional()
  @IsUUID()
  jurisdictionId?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
