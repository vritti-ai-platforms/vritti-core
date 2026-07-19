import { Trim } from '@vritti/api-sdk/decorators';
import { IsBoolean, IsIn, IsNotEmpty, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';
import { type TaxRegistrationType, taxRegistrationTypeEnum } from '@/db/schema';

export class UpdateCompanyRegistrationDto {
  @IsUUID()
  id: string;

  @IsOptional()
  @IsUUID()
  jurisdictionId?: string;

  @Trim({ nullify: false })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  registrationNumber?: string;

  @IsOptional()
  @IsIn(taxRegistrationTypeEnum.enumValues)
  registrationType?: TaxRegistrationType;

  @IsOptional()
  @IsBoolean()
  isPrimary?: boolean;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
