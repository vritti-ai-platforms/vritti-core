import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class PersonRegistrationResponseDto {
  @ApiProperty({ description: 'Tax registration ID' })
  id: string;

  @ApiProperty({ description: 'The person (party) ID' })
  partyId: string;

  @ApiProperty({ description: 'Tax jurisdiction ID' })
  jurisdictionId: string;

  @ApiPropertyOptional({ description: 'Tax jurisdiction name', nullable: true })
  jurisdictionName: string | null;

  @ApiProperty({ description: 'Registration number', example: '22AAAAA0000A1Z5' })
  registrationNumber: string;

  @ApiProperty({ description: 'Registration type', enum: ['GSTIN', 'VAT', 'TIN', 'PAN', 'OTHER'] })
  registrationType: string;

  @ApiProperty({ description: 'Whether this is the primary registration' })
  isPrimary: boolean;

  @ApiProperty({ description: 'Whether the registration is active' })
  isActive: boolean;

  @ApiProperty({ description: 'ISO timestamp of creation' })
  createdAt: string;

  @ApiProperty({ description: 'ISO timestamp of last update' })
  updatedAt: string;
}
