import { Trim } from '@vritti/api-sdk/decorators';
import { IsBoolean, IsEnum, IsNotEmpty, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';
import { TaxRegistrationTypeValues } from '@/db/schema';

export class CreateTaxRegistrationDto {
  // Absent on the VAP path — the column defaults to the workspace entity, so a body value cannot
  // point a registration at someone else's legal entity
  @IsOptional()
  @IsUUID()
  legalEntityId?: string;

  @IsUUID()
  jurisdictionId: string;

  @Trim({ nullify: false })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  registrationNumber: string;

  @IsEnum(TaxRegistrationTypeValues)
  registrationType: keyof typeof TaxRegistrationTypeValues;

  @IsOptional()
  @IsBoolean()
  isPrimary?: boolean;
}
