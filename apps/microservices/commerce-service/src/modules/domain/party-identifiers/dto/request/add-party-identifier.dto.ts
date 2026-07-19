import { Trim } from '@vritti/api-sdk/decorators';
import { IsBoolean, IsEnum, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';
import { type PartyIdentifierType, PartyIdentifierTypeValues } from '@/db/schema';

export class AddPartyIdentifierDto {
  @IsEnum(PartyIdentifierTypeValues)
  idType: PartyIdentifierType;

  @Trim({ nullify: false })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  idValue: string;

  @IsOptional()
  @IsBoolean()
  isPrimary?: boolean;
}
