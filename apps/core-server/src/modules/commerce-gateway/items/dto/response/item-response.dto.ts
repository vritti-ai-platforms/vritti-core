import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ItemResponseDto {
  @ApiProperty({ description: 'Item ID' })
  id: string;

  @ApiProperty({ description: 'Business unit ID' })
  businessUnitId: string;

  @ApiPropertyOptional({ description: 'Category ID', nullable: true })
  categoryId: string | null;

  @ApiPropertyOptional({ description: 'Category name', nullable: true })
  categoryName: string | null;

  @ApiProperty({ description: 'Item type', enum: ['PRODUCT', 'SERVICE'] })
  type: string;

  @ApiProperty({ description: 'Item code' })
  code: string;

  @ApiProperty({ description: 'Item name' })
  name: string;

  @ApiPropertyOptional({ description: 'Item description', nullable: true })
  description: string | null;

  @ApiProperty({ description: 'Base price' })
  basePrice: string;

  @ApiPropertyOptional({ description: 'Cost price', nullable: true })
  costPrice: string | null;

  @ApiPropertyOptional({ description: 'Tax group ID', nullable: true })
  taxGroupId: string | null;

  @ApiPropertyOptional({ description: 'HSN/SAC code', nullable: true })
  hsnSacCode: string | null;

  @ApiProperty({ description: 'Whether the item is available' })
  isAvailable: boolean;

  @ApiProperty({ description: 'Whether the item is visible' })
  isVisible: boolean;

  @ApiProperty({ description: 'Whether inventory is tracked' })
  trackInventory: boolean;

  @ApiProperty({ description: 'Display sort order' })
  sortOrder: number;

  @ApiProperty({ description: 'ISO timestamp of creation' })
  createdAt: string;

  @ApiProperty({ description: 'ISO timestamp of last update' })
  updatedAt: string;
}
