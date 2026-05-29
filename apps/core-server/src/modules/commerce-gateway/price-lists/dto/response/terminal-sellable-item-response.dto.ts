import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class TerminalSellableItemResponseDto {
  @ApiProperty({ description: 'Terminal ID' })
  terminalId: string;

  @ApiProperty({ description: 'Price list ID from which item is resolved' })
  priceListId: string;

  @ApiProperty({ description: 'Price list name from which item is resolved' })
  priceListName: string;

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

  @ApiProperty({ description: 'Base price in minor units (bigint serialized as string)' })
  basePrice: string;

  @ApiPropertyOptional({ description: 'Category name', nullable: true })
  categoryName: string | null;

  @ApiPropertyOptional({ description: 'Price override in minor units (bigint serialized as string)', nullable: true })
  priceOverride: string | null;

  @ApiProperty({ description: 'Resolved price list priority' })
  priority: number;

  @ApiProperty({ description: 'Resolved price list item sort order' })
  sortOrder: number;
}
