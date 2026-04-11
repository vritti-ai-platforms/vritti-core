import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class LocationStockResponseDto {
  @ApiProperty({ description: 'Inventory level ID' })
  id: string;

  @ApiProperty({ description: 'Inventory item ID' })
  inventoryItemId: string;

  @ApiPropertyOptional({ description: 'Item name', nullable: true })
  itemName: string | null;

  @ApiPropertyOptional({ description: 'Item code', nullable: true })
  itemCode: string | null;

  @ApiPropertyOptional({ description: 'Unit of measure symbol', nullable: true })
  uomSymbol: string | null;

  @ApiProperty({ description: 'Total stocked quantity' })
  stockedQuantity: number;

  @ApiProperty({ description: 'Reserved quantity' })
  reservedQuantity: number;

  @ApiProperty({ description: 'Available quantity (stocked - reserved)' })
  availableQuantity: number;

  @ApiProperty({ description: 'Reorder threshold level' })
  reorderLevel: number;
}
