import { Trim } from '@vritti/api-sdk/decorators';
import { IsBoolean, IsEnum, IsNotEmpty, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';
import { TaxRegistrationTypeValues } from '@/db/schema';

export class UpdateTaxRegistrationDto {
  @IsOptional()
  @IsUUID()
  jurisdictionId?: string;

  @IsOptional()
  @Trim({ nullify: false })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  registrationNumber?: string;

  @IsOptional()
  @IsEnum(TaxRegistrationTypeValues)
  registrationType?: keyof typeof TaxRegistrationTypeValues;

  @IsOptional()
  @IsBoolean()
  isPrimary?: boolean;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
