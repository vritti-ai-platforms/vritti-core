import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class PriceListItemResponseDto {
  @ApiProperty({ description: 'Price list ID' })
  priceListId: string;

  @ApiProperty({ description: 'Item variant ID' })
  itemVariantId: string;

  @ApiProperty({ description: 'Item variant SKU' })
  itemVariantSku: string;

  @ApiProperty({ description: 'Item variant name' })
  itemVariantName: string;

  @ApiProperty({ description: 'Parent item ID' })
  itemId: string;

  @ApiProperty({ description: 'Parent item name' })
  itemName: string;

  @ApiProperty({ description: 'Base price in minor units' })
  basePrice: number;

  @ApiPropertyOptional({ description: 'Category name', nullable: true })
  categoryName: string | null;

  @ApiProperty({ description: 'Sort order' })
  sortOrder: number;

  @ApiProperty({ description: 'Whether item is visible' })
  isVisible: boolean;

  @ApiPropertyOptional({ description: 'Price override in minor units', nullable: true })
  priceOverride: number | null;

  @ApiProperty({ description: 'ISO timestamp of creation' })
  createdAt: string;

  @ApiProperty({ description: 'ISO timestamp of last update' })
  updatedAt: string;
}
