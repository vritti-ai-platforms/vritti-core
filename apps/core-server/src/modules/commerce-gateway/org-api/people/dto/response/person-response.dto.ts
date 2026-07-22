import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class PersonPrimaryAddressDto {
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

export class PersonResponseDto {
  @ApiProperty({ description: 'Person (party) ID' })
  id: string;

  @ApiProperty({ description: 'Party type', enum: ['PERSON', 'COMPANY'], example: 'PERSON' })
  partyType: string;

  @ApiProperty({ description: 'Derived display name (first + last)' })
  displayName: string;

  @ApiPropertyOptional({ description: 'First name', nullable: true })
  firstName: string | null;

  @ApiPropertyOptional({ description: 'Last name', nullable: true })
  lastName: string | null;

  @ApiPropertyOptional({ description: 'Primary email address', nullable: true })
  email: string | null;

  @ApiPropertyOptional({ description: 'Primary phone number', nullable: true })
  phone: string | null;

  @ApiPropertyOptional({ type: PersonPrimaryAddressDto, description: 'Primary address', nullable: true })
  primaryAddress: PersonPrimaryAddressDto | null;

  @ApiProperty({ description: 'Whether the person is selectable' })
  isActive: boolean;

  @ApiProperty({ description: 'Whether hard-delete is allowed' })
  canDelete: boolean;

  @ApiProperty({ description: 'ISO timestamp of creation' })
  createdAt: string;

  @ApiProperty({ description: 'ISO timestamp of last update' })
  updatedAt: string;
}
