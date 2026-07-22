import { Trim } from '@vritti/api-sdk/decorators';
import { Type } from 'class-transformer';
import { IsBoolean, IsEmail, IsEnum, IsNotEmpty, IsOptional, IsString, MaxLength, ValidateNested } from 'class-validator';
import { type PartyIdentifierType, PartyIdentifierTypeValues } from '@/db/schema';
import { CompanyAddressInputDto } from './company-address-input.dto';

export class CreatePersonDto {
  @Trim({ nullify: false })
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  firstName: string;

  @Trim()
  @IsOptional()
  @IsString()
  @MaxLength(120)
  lastName?: string | null;

  @Trim()
  @IsOptional()
  @IsEmail()
  @MaxLength(255)
  email?: string | null;

  @Trim()
  @IsOptional()
  @IsString()
  @MaxLength(20)
  phone?: string | null;

  @IsOptional()
  @IsEnum(PartyIdentifierTypeValues)
  identifierType?: PartyIdentifierType;

  @Trim({ nullify: false })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  identifierValue?: string;

  @IsBoolean()
  isActive: boolean;

  @IsOptional()
  @ValidateNested()
  @Type(() => CompanyAddressInputDto)
  address?: CompanyAddressInputDto;
}
