import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class PersonResponseDto {
  @ApiProperty({ description: 'Person (party) ID' })
  id: string;

  @ApiProperty({ description: 'Party type', enum: ['PERSON', 'ORGANIZATION'], example: 'PERSON' })
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

  @ApiPropertyOptional({ description: 'Home country (ISO-2)', nullable: true })
  countryCode: string | null;

  @ApiProperty({ description: 'Whether the person is selectable' })
  isActive: boolean;

  @ApiProperty({ description: 'Whether hard-delete is allowed' })
  canDelete: boolean;

  @ApiProperty({ description: 'ISO timestamp of creation' })
  createdAt: string;

  @ApiProperty({ description: 'ISO timestamp of last update' })
  updatedAt: string;
}
