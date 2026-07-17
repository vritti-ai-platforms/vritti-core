import { Trim } from '@vritti/api-sdk/decorators';
import { IsBoolean, IsEmail, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

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

  @Trim()
  @IsOptional()
  @IsString()
  @MaxLength(500)
  address?: string | null;

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
