import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class PartyIdentifierResponseDto {
  @ApiProperty({ description: 'Identifier ID' })
  id: string;

  @ApiProperty({ description: 'The party ID the identifier belongs to' })
  partyId: string;

  @ApiProperty({
    description: 'Identifier type',
    enum: ['PAN', 'AADHAAR', 'PASSPORT', 'DRIVING_LICENSE', 'VOTER_ID', 'CIVIL_ID', 'NATIONAL_ID', 'DUNS', 'LEI', 'CIN'],
  })
  idType: string;

  @ApiProperty({ description: 'Identifier value' })
  idValue: string;

  @ApiProperty({ description: 'Whether this is the primary identifier' })
  isPrimary: boolean;

  @ApiProperty({ description: 'Whether the identifier is active' })
  isActive: boolean;

  @ApiPropertyOptional({ description: 'ISO timestamp of verification', nullable: true })
  verifiedAt: string | null;

  @ApiProperty({ description: 'ISO timestamp of creation' })
  createdAt: string;
}
