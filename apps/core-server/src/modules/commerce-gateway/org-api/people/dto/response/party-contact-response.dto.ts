import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class PartyContactResponseDto {
  @ApiProperty({ description: 'Contact ID' })
  id: string;

  @ApiProperty({ description: 'The person (party) ID' })
  partyId: string;

  @ApiProperty({ description: 'Contact purpose', enum: ['ORDER', 'ACCOUNTS', 'ESCALATION'] })
  purpose: string;

  @ApiPropertyOptional({ description: 'Contact label', nullable: true })
  label: string | null;

  @ApiPropertyOptional({ description: 'Contact person name', nullable: true })
  name: string | null;

  @ApiPropertyOptional({ description: 'Contact email', nullable: true })
  email: string | null;

  @ApiPropertyOptional({ description: 'Contact phone', nullable: true })
  phone: string | null;

  @ApiProperty({ description: 'Whether this is the primary contact for the party' })
  isPrimary: boolean;

  @ApiProperty({ description: 'Whether the contact is active' })
  isActive: boolean;

  @ApiProperty({ description: 'ISO timestamp of creation' })
  createdAt: string;

  @ApiProperty({ description: 'ISO timestamp of last update' })
  updatedAt: string;
}
