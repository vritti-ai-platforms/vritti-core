import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Trim } from '@vritti/api-sdk/decorators';
import { IsBoolean, IsEmail, IsEnum, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';
import { PARTY_IDENTIFIER_TYPES, type PartyIdentifierTypeValue } from './add-party-identifier.dto';

export class CreatePersonDto {
  @Trim({ nullify: false })
  @ApiProperty({ description: 'First name', example: 'John' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  firstName: string;

  @Trim()
  @ApiPropertyOptional({ description: 'Last name', example: 'Smith' })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  lastName?: string | null;

  @Trim()
  @ApiPropertyOptional({ description: 'Primary email address' })
  @IsOptional()
  @IsEmail()
  @MaxLength(255)
  email?: string | null;

  @Trim()
  @ApiPropertyOptional({ description: 'Primary phone number' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  phone?: string | null;

  @ApiPropertyOptional({ description: 'Initial identifier type', enum: PARTY_IDENTIFIER_TYPES })
  @IsOptional()
  @IsEnum(PARTY_IDENTIFIER_TYPES)
  identifierType?: PartyIdentifierTypeValue;

  @Trim({ nullify: false })
  @ApiPropertyOptional({ description: 'Initial identifier value' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  identifierValue?: string;

  @ApiProperty({ description: 'Whether the person is selectable' })
  @IsBoolean()
  isActive: boolean;
}
