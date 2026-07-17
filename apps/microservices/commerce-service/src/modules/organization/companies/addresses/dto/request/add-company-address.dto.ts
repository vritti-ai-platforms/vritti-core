import { Trim } from '@vritti/api-sdk/decorators';
import { IsBoolean, IsEnum, IsNotEmpty, IsOptional, IsString, IsUUID, Length, MaxLength } from 'class-validator';
import { type PartyAddressType, PartyAddressTypeValues } from '@/db/schema';

export class AddCompanyAddressDto {
  @IsUUID()
  companyId: string;

  @IsEnum(PartyAddressTypeValues)
  type: PartyAddressType;

  @Trim({ nullify: false })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  line1: string;

  @Trim()
  @IsOptional()
  @IsString()
  line2?: string;

  @Trim()
  @IsOptional()
  @IsString()
  city?: string;

  @Trim()
  @IsOptional()
  @IsString()
  region?: string;

  @Trim()
  @IsOptional()
  @IsString()
  postalCode?: string;

  @IsString()
  @Length(2, 2)
  countryCode: string;

  @IsOptional()
  @IsBoolean()
  isPrimary?: boolean;
}
