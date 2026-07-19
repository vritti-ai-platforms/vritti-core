import { Trim } from '@vritti/api-sdk/decorators';
import { IsBoolean, IsEnum, IsNotEmpty, IsOptional, IsString, Length, MaxLength } from 'class-validator';
import { type PartyAddressType, PartyAddressTypeValues } from '@/db/schema';

export class UpdatePartyAddressDto {
  @IsOptional()
  @IsEnum(PartyAddressTypeValues)
  type?: PartyAddressType;

  @Trim({ nullify: false })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  line1?: string;

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

  @IsOptional()
  @IsString()
  @Length(2, 2)
  countryCode?: string;

  @IsOptional()
  @IsBoolean()
  isPrimary?: boolean;
}
