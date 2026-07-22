import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PartyFunctionResponseDto } from '@/modules/commerce-gateway/_shared/dto/party-function-assignment.dto';

export class CompanyPersonResponseDto {
  @ApiProperty({ description: 'Party relationship ID' })
  id: string;

  @ApiProperty({ description: 'The company (parent COMPANY party) ID' })
  parentPartyId: string;

  @ApiProperty({ description: 'The linked person (child PERSON party) ID' })
  childPartyId: string;

  @ApiPropertyOptional({ description: 'Display name of the linked person', nullable: true })
  childName: string | null;

  @ApiPropertyOptional({ description: 'Primary email of the linked person', nullable: true })
  childEmail: string | null;

  @ApiPropertyOptional({ description: 'Primary phone of the linked person', nullable: true })
  childPhone: string | null;

  @ApiPropertyOptional({ description: 'Job title of the person at the company', nullable: true })
  jobTitle: string | null;

  @ApiProperty({ description: 'Whether the relationship is active' })
  isActive: boolean;

  @ApiProperty({ type: [PartyFunctionResponseDto], description: 'Contact functions assigned to this person' })
  functions: PartyFunctionResponseDto[];

  @ApiProperty({ description: 'ISO timestamp of creation' })
  createdAt: string;

  @ApiProperty({ description: 'ISO timestamp of last update' })
  updatedAt: string;
}
