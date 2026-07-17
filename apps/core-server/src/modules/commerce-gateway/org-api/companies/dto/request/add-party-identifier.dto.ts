import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Trim } from '@vritti/api-sdk/decorators';
import { IsBoolean, IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';

export const PARTY_IDENTIFIER_TYPES = {
  PAN: 'PAN',
  AADHAAR: 'AADHAAR',
  PASSPORT: 'PASSPORT',
  DRIVING_LICENSE: 'DRIVING_LICENSE',
  VOTER_ID: 'VOTER_ID',
  CIVIL_ID: 'CIVIL_ID',
  NATIONAL_ID: 'NATIONAL_ID',
  DUNS: 'DUNS',
  LEI: 'LEI',
  CIN: 'CIN',
} as const;

export type PartyIdentifierTypeValue = (typeof PARTY_IDENTIFIER_TYPES)[keyof typeof PARTY_IDENTIFIER_TYPES];

export class AddPartyIdentifierDto {
  @ApiProperty({ description: 'Identifier type', enum: PARTY_IDENTIFIER_TYPES })
  @IsEnum(PARTY_IDENTIFIER_TYPES)
  idType: PartyIdentifierTypeValue;

  @Trim({ nullify: false })
  @ApiProperty({ description: 'Identifier value', example: 'AAAAA0000A' })
  @IsString()
  @MaxLength(100)
  idValue: string;

  @ApiPropertyOptional({ description: 'Whether this is the primary identifier' })
  @IsOptional()
  @IsBoolean()
  isPrimary?: boolean;
}
