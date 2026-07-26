import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CompanyPrimaryAddressDto {
  @ApiProperty({ description: 'Address ID' })
  id: string;

  @ApiProperty({ description: 'Address line 1' })
  line1: string;

  @ApiPropertyOptional({ description: 'Address line 2', nullable: true })
  line2: string | null;

  @ApiPropertyOptional({ description: 'City', nullable: true })
  city: string | null;

  @ApiPropertyOptional({ description: 'State / region', nullable: true })
  region: string | null;

  @ApiPropertyOptional({ description: 'Postal / ZIP code', nullable: true })
  postalCode: string | null;

  @ApiProperty({ description: 'Country (ISO-2)' })
  countryCode: string;
}

export class CompanyResponseDto {
  @ApiProperty({ description: 'Company (party) ID' })
  id: string;

  @ApiProperty({ description: 'Party type', enum: ['PERSON', 'COMPANY'], example: 'COMPANY' })
  partyType: string;

  @ApiProperty({ description: 'Human-readable display name' })
  displayName: string;

  @ApiPropertyOptional({ description: 'Registered legal name', nullable: true })
  legalName: string | null;

  @ApiPropertyOptional({ description: 'Primary email address', nullable: true })
  email: string | null;

  @ApiPropertyOptional({ description: 'Primary phone number', nullable: true })
  phone: string | null;

  @ApiPropertyOptional({ type: CompanyPrimaryAddressDto, description: 'Primary address', nullable: true })
  primaryAddress: CompanyPrimaryAddressDto | null;

  @ApiPropertyOptional({ description: 'Company website URL', nullable: true })
  website: string | null;

  @ApiPropertyOptional({ description: 'Tax jurisdiction ID', nullable: true })
  jurisdictionId: string | null;

  @ApiProperty({ description: 'Whether the company is selectable' })
  isActive: boolean;

  @ApiProperty({ description: 'Whether hard-delete is allowed (false when a supplier references it)' })
  canDelete: boolean;

  @ApiProperty({ description: 'ISO timestamp of creation' })
  createdAt: string;

  @ApiProperty({ description: 'ISO timestamp of last update' })
  updatedAt: string;
}
