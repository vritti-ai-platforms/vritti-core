import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class OfferingResponseDto {
  @ApiProperty() id: string;
  @ApiProperty({ description: 'Feeds every variant SKU', example: 'tshirt-classic' }) code: string;
  @ApiProperty() name: string;
  @ApiPropertyOptional({ nullable: true }) description: string | null;
  @ApiPropertyOptional({ nullable: true }) categoryId: string | null;
  @ApiProperty({ enum: ['STOCK', 'ASSEMBLY', 'COMPOSITE', 'SERVICE'] }) fulfilmentType: string;
  @ApiProperty() taxClassId: string;
  @ApiProperty({ description: 'Off until the offering has at least one variant' }) isActive: boolean;
  @ApiProperty() sortOrder: number;
  @ApiPropertyOptional({ nullable: true }) legalEntityId: string | null;
  @ApiPropertyOptional({ nullable: true }) siteId: string | null;
  @ApiProperty({ enum: ['ORG', 'LE', 'SITE'] }) ownerScope: string;
  @ApiProperty() dimensionCount: number;
  @ApiProperty() variantCount: number;

  @ApiProperty({ description: 'Variants with no bill of materials — they cannot be activated yet' })
  variantsMissingBomCount: number;
  @ApiProperty({ description: 'False when owned by a wider scope' }) canEdit: boolean;
  @ApiProperty({ description: 'False until the offering has a variant, or when owned by a wider scope' })
  canMarkActive: boolean;
  @ApiProperty({ description: 'False while the offering still has variants' }) canDelete: boolean;
  @ApiProperty() createdAt: string;
  @ApiProperty() updatedAt: string;
}
