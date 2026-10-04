import { Trim } from '@vritti/api-sdk/decorators';
import { IsBoolean, IsIn, IsNotEmpty, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';
import { type TaxRegistrationType, taxRegistrationTypeEnum } from '@/db/schema';

export class CreatePersonRegistrationDto {
  @IsUUID('7')
  personId: string;

  @IsUUID('7')
  jurisdictionId: string;

  @Trim({ nullify: false })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  registrationNumber: string;

  @IsIn(taxRegistrationTypeEnum.enumValues)
  registrationType: TaxRegistrationType;

  @IsOptional()
  @IsBoolean()
  isPrimary?: boolean;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
