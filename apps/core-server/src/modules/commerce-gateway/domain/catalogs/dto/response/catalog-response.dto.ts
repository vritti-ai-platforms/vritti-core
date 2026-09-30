import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CatalogResponseDto {
  @ApiProperty() id: string;
  @ApiProperty() name: string;
  @ApiPropertyOptional({ nullable: true }) legalEntityId: string | null;
  @ApiPropertyOptional({ nullable: true }) siteId: string | null;

  @ApiProperty({ enum: ['ORG', 'LE', 'SITE'], description: 'Workspace that owns this catalog' })
  ownerScope: 'ORG' | 'LE' | 'SITE';

  @ApiProperty({ description: 'Name of the owning workspace, resolved from core' })
  ownerName: string;
  @ApiProperty() taxInclusive: boolean;
  @ApiProperty() isActive: boolean;
  @ApiProperty() listingCount: number;
  @ApiProperty() channelCount: number;
  @ApiProperty() createdAt: string;
  @ApiProperty() updatedAt: string;
}
