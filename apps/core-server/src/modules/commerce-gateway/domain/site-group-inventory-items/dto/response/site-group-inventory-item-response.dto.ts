import { ApiProperty } from '@nestjs/swagger';

export class SiteGroupInventoryItemResponseDto {
  @ApiProperty() id: string;
  @ApiProperty() inventoryItemId: string;
  @ApiProperty() itemName: string;
  @ApiProperty() itemSku: string;
  @ApiProperty() siteId: string;
  @ApiProperty() isStocked: boolean;
  @ApiProperty() reorderPoint: number;
  @ApiProperty() maxStockLevel: number;
  @ApiProperty() safetyStock: number;
}
