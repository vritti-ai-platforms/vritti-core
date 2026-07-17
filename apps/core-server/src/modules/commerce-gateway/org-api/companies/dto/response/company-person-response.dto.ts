import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CompanyPersonResponseDto {
  @ApiProperty({ description: 'Party relationship ID' })
  id: string;

  @ApiProperty({ description: 'The company (parent ORGANIZATION party) ID' })
  parentPartyId: string;

  @ApiProperty({ description: 'The linked person (child PERSON party) ID' })
  childPartyId: string;

  @ApiPropertyOptional({ description: 'Display name of the linked person', nullable: true })
  childName: string | null;

  @ApiPropertyOptional({ description: 'Job title of the person at the company', nullable: true })
  jobTitle: string | null;

  @ApiPropertyOptional({ description: 'Secondary phone number for this relationship', nullable: true })
  secondaryPhone: string | null;

  @ApiPropertyOptional({ description: 'Secondary email for this relationship', nullable: true })
  secondaryEmail: string | null;

  @ApiProperty({ description: 'Whether this is the primary person' })
  isPrimary: boolean;

  @ApiProperty({ description: 'Whether the relationship is active' })
  isActive: boolean;

  @ApiProperty({ description: 'ISO timestamp of creation' })
  createdAt: string;

  @ApiProperty({ description: 'ISO timestamp of last update' })
  updatedAt: string;
}
