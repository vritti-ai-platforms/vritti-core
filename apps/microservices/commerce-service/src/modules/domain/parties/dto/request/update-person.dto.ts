import { Trim } from '@vritti/api-sdk/decorators';
import { IsBoolean, IsEmail, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export class UpdatePersonDto {
  @IsUUID()
  id: string;

  @Trim({ nullify: false })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  firstName?: string;

  @Trim()
  @IsOptional()
  @IsString()
  @MaxLength(120)
  lastName?: string | null;

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
  isActive?: boolean;
}
