import { Trim } from '@vritti/api-sdk/decorators';
import { IsBoolean, IsEmail, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export class AddCompanyPersonDto {
  @IsUUID()
  companyId: string;

  @IsUUID()
  childPartyId: string;

  @Trim()
  @IsOptional()
  @IsString()
  @MaxLength(100)
  jobTitle?: string | null;

  @Trim()
  @IsOptional()
  @IsString()
  @MaxLength(20)
  secondaryPhone?: string | null;

  @Trim()
  @IsOptional()
  @IsEmail()
  @MaxLength(255)
  secondaryEmail?: string | null;

  @IsOptional()
  @IsBoolean()
  isPrimary?: boolean;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
