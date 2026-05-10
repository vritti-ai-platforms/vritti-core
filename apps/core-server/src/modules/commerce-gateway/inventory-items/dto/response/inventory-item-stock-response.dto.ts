import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

// Per-location stock aggregate for an inventory item, sourced from inventory_item_quants.
// `reorderLevel` is null when the location has stock but no inventory_item_locations row.
export class InventoryItemStockResponseDto {
  @ApiProperty() locationId: string;
  @ApiPropertyOptional({ nullable: true }) locationName: string | null;
  @ApiPropertyOptional({ nullable: true }) locationPath: string | null;
  @ApiProperty() stockedQuantity: number;
  @ApiProperty() reservedQuantity: number;
  @ApiProperty() availableQuantity: number;
  @ApiPropertyOptional({ nullable: true }) reorderLevel: number | null;
}
