import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Trim } from '@vritti/api-sdk/decorators';
import { IsBoolean, IsEmail, IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';

export const PARTY_CONTACT_PURPOSES = {
  ORDER: 'ORDER',
  ACCOUNTS: 'ACCOUNTS',
  ESCALATION: 'ESCALATION',
} as const;

export type PartyContactPurposeValue = (typeof PARTY_CONTACT_PURPOSES)[keyof typeof PARTY_CONTACT_PURPOSES];

export class CreatePartyContactDto {
  @ApiProperty({ description: 'Contact purpose', enum: PARTY_CONTACT_PURPOSES })
  @IsEnum(PARTY_CONTACT_PURPOSES)
  purpose: PartyContactPurposeValue;

  @Trim()
  @ApiPropertyOptional({ description: 'Contact label', example: 'Primary sales desk', nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  label?: string | null;

  @Trim()
  @ApiPropertyOptional({ description: 'Contact person name', example: 'Priya Sharma', nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(150)
  name?: string | null;

  @Trim()
  @ApiPropertyOptional({ description: 'Contact email', example: 'orders@acmefoods.com', nullable: true })
  @IsOptional()
  @IsEmail()
  @MaxLength(255)
  email?: string | null;

  @Trim()
  @ApiPropertyOptional({ description: 'Contact phone', example: '+91 98765 43210', nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  phone?: string | null;

  @ApiPropertyOptional({ description: 'Whether this is the primary contact for the party' })
  @IsOptional()
  @IsBoolean()
  isPrimary?: boolean;

  @ApiPropertyOptional({ description: 'Whether the contact is active', default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
