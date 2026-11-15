import { ApiProperty } from '@nestjs/swagger';

export class InventoryItemSiteStockLevelResponseDto {
  @ApiProperty() id: string;
  @ApiProperty() inventoryItemId: string;
  @ApiProperty() siteId: string;
  @ApiProperty({ description: "Reorder point, in the item's primary unit" }) reorderPoint: number;
  @ApiProperty({ description: "Safety stock, in the item's primary unit" }) safetyStock: number;
  @ApiProperty({ description: "Maximum stock level, in the item's primary unit" }) maxStockLevel: number;
}
