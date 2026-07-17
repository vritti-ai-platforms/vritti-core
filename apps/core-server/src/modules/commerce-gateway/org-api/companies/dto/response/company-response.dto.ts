import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CompanyResponseDto {
  @ApiProperty({ description: 'Company (party) ID' })
  id: string;

  @ApiProperty({ description: 'Party type', enum: ['PERSON', 'ORGANIZATION'], example: 'ORGANIZATION' })
  partyType: string;

  @ApiProperty({ description: 'Human-readable display name' })
  displayName: string;

  @ApiPropertyOptional({ description: 'Registered legal name', nullable: true })
  legalName: string | null;

  @ApiPropertyOptional({ description: 'Primary email address', nullable: true })
  email: string | null;

  @ApiPropertyOptional({ description: 'Primary phone number', nullable: true })
  phone: string | null;

  @ApiPropertyOptional({ description: 'Mailing address', nullable: true })
  address: string | null;

  @ApiPropertyOptional({ description: 'Company website URL', nullable: true })
  website: string | null;

  @ApiPropertyOptional({ description: 'Tax jurisdiction ID', nullable: true })
  jurisdictionId: string | null;

  @ApiPropertyOptional({ description: 'Home country (ISO-2)', nullable: true })
  countryCode: string | null;

  @ApiProperty({ description: 'Whether the company is selectable' })
  isActive: boolean;

  @ApiProperty({ description: 'ISO timestamp of creation' })
  createdAt: string;

  @ApiProperty({ description: 'ISO timestamp of last update' })
  updatedAt: string;
}
