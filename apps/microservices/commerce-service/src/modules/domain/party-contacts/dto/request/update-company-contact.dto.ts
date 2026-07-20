import { Trim } from '@vritti/api-sdk/decorators';
import { IsBoolean, IsEmail, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export class UpdateCompanyContactDto {
  @IsUUID()
  id: string;

  @Trim()
  @IsOptional()
  @IsString()
  @MaxLength(120)
  label?: string | null;

  @Trim()
  @IsOptional()
  @IsString()
  @MaxLength(150)
  name?: string | null;

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
  @IsBoolean()
  isPrimary?: boolean;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
