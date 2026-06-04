import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class OfferingResponseDto {
  @ApiProperty({ description: 'Offering ID' })
  id: string;

  @ApiProperty({ description: 'Business unit ID' })
  businessUnitId: string;

  @ApiPropertyOptional({ description: 'Category ID', nullable: true })
  categoryId: string | null;

  @ApiPropertyOptional({ description: 'Category name', nullable: true })
  categoryName: string | null;

  @ApiProperty({ description: 'Fulfilment type', enum: ['STOCK', 'SERVICE', 'COMPOSITE'] })
  fulfilmentType: string;

  @ApiProperty({ description: 'Offering name' })
  name: string;

  @ApiPropertyOptional({ description: 'Offering description', nullable: true })
  description: string | null;

  @ApiPropertyOptional({ description: 'Sales tax group ID', nullable: true })
  salesTaxGroupId: string | null;

  @ApiProperty({ description: 'Catalog currency code (ISO 4217)' })
  currencyCode: string;

  @ApiProperty({ description: 'Whether the offering is available' })
  isAvailable: boolean;

  @ApiProperty({ description: 'Display sort order' })
  sortOrder: number;

  @ApiProperty({ description: 'Number of modifier groups attached to the offering' })
  modifierGroupCount: number;

  @ApiProperty({ description: 'ISO timestamp of creation' })
  createdAt: string;

  @ApiProperty({ description: 'ISO timestamp of last update' })
  updatedAt: string;
}
