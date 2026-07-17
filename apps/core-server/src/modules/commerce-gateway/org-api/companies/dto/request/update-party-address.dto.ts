import { ApiPropertyOptional } from '@nestjs/swagger';
import { Trim } from '@vritti/api-sdk/decorators';
import { IsBoolean, IsEnum, IsOptional, IsString, Length, MaxLength } from 'class-validator';

export const PARTY_ADDRESS_TYPES = {
  REGISTERED: 'REGISTERED',
  BILLING: 'BILLING',
  SHIPPING: 'SHIPPING',
  OTHER: 'OTHER',
} as const;

export type PartyAddressTypeValue = (typeof PARTY_ADDRESS_TYPES)[keyof typeof PARTY_ADDRESS_TYPES];

export class UpdatePartyAddressDto {
  @ApiPropertyOptional({ description: 'Address type', enum: PARTY_ADDRESS_TYPES })
  @IsOptional()
  @IsEnum(PARTY_ADDRESS_TYPES)
  type?: PartyAddressTypeValue;

  @Trim({ nullify: false })
  @ApiPropertyOptional({ description: 'Address line 1', example: '221B Baker Street' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  line1?: string;

  @Trim()
  @ApiPropertyOptional({ description: 'Address line 2' })
  @IsOptional()
  @IsString()
  line2?: string;

  @Trim()
  @ApiPropertyOptional({ description: 'City' })
  @IsOptional()
  @IsString()
  city?: string;

  @Trim()
  @ApiPropertyOptional({ description: 'Region, state, or province' })
  @IsOptional()
  @IsString()
  region?: string;

  @Trim()
  @ApiPropertyOptional({ description: 'Postal or ZIP code' })
  @IsOptional()
  @IsString()
  postalCode?: string;

  @ApiPropertyOptional({ description: 'ISO 3166-1 alpha-2 country code', example: 'IN' })
  @IsOptional()
  @IsString()
  @Length(2, 2)
  countryCode?: string;

  @ApiPropertyOptional({ description: 'Whether this is the primary address' })
  @IsOptional()
  @IsBoolean()
  isPrimary?: boolean;
}
