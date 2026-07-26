import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class PartyLicenseResponseDto {
  @ApiProperty({ description: 'License ID' })
  id: string;

  @ApiProperty({ description: 'The party ID' })
  partyId: string;

  @ApiProperty({ description: 'License type', enum: ['DRUG', 'EXCISE', 'FSSAI', 'OTHER'] })
  licenseType: string;

  @ApiProperty({ description: 'License number', example: 'DL-20B-123456' })
  licenseNumber: string;

  @ApiPropertyOptional({ description: 'Region or state the license covers', nullable: true })
  region: string | null;

  @ApiPropertyOptional({ description: 'License expiry date (ISO date)', nullable: true })
  validTo: string | null;

  @ApiPropertyOptional({ description: 'Additional notes', nullable: true })
  notes: string | null;

  @ApiProperty({ description: 'Whether the license is active' })
  isActive: boolean;

  @ApiProperty({ description: 'ISO timestamp of creation' })
  createdAt: string;

  @ApiProperty({ description: 'ISO timestamp of last update' })
  updatedAt: string;
}
