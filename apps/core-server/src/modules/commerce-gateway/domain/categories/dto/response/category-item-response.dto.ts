import { ApiProperty } from '@nestjs/swagger';

// One inventory item row shown under a leaf (CATEGORY-role) category.
export class CategoryItemResponseDto {
  @ApiProperty({ description: 'Inventory item ID' }) id: string;
  @ApiProperty({ description: 'Item name' }) name: string;
  @ApiProperty({ description: 'Item SKU', example: 'dolo-650-tab' }) sku: string;
  @ApiProperty({ description: 'Inventory item type' }) type: string;
  @ApiProperty({ description: 'Tracking mode (QUANTITY / LOT / LOT_SERIAL / SERIAL)' }) tracking: string;
  @ApiProperty({ description: 'Unit of measure symbol' }) uomSymbol: string;
}
