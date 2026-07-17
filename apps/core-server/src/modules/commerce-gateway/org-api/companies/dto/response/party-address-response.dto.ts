import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class PartyAddressResponseDto {
  @ApiProperty({ description: 'Address ID' })
  id: string;

  @ApiProperty({ description: 'The party ID the address belongs to' })
  partyId: string;

  @ApiProperty({ description: 'Address type', enum: ['REGISTERED', 'BILLING', 'SHIPPING', 'OTHER'] })
  type: string;

  @ApiProperty({ description: 'Address line 1' })
  line1: string;

  @ApiPropertyOptional({ description: 'Address line 2', nullable: true })
  line2: string | null;

  @ApiPropertyOptional({ description: 'City', nullable: true })
  city: string | null;

  @ApiPropertyOptional({ description: 'Region, state, or province', nullable: true })
  region: string | null;

  @ApiPropertyOptional({ description: 'Postal or ZIP code', nullable: true })
  postalCode: string | null;

  @ApiProperty({ description: 'ISO 3166-1 alpha-2 country code' })
  countryCode: string;

  @ApiProperty({ description: 'Whether this is the primary address' })
  isPrimary: boolean;

  @ApiProperty({ description: 'Whether the address is active' })
  isActive: boolean;

  @ApiProperty({ description: 'ISO timestamp of creation' })
  createdAt: string;
}
