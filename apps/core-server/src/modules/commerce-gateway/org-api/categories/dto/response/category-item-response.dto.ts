import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

// One inventory item row shown under a leaf (CATEGORY-role) category.
export class CategoryItemResponseDto {
  @ApiProperty({ description: 'Inventory item ID' }) id: string;
  @ApiProperty({ description: 'Item name' }) name: string;
  @ApiProperty({ description: 'Item code / SKU' }) code: string;
  @ApiProperty({ description: 'Inventory item type' }) type: string;
  @ApiProperty({ description: 'Tracking mode (lot / serial / quantity / lot_serial)' }) tracking: string;
  @ApiPropertyOptional({ description: 'Unit of measure symbol', nullable: true }) uomSymbol: string | null;
}
