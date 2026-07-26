import { ApiProperty } from '@nestjs/swagger';

export class SiteGroupItemLevelsResponseDto {
  @ApiProperty() inventoryItemId: string;
  @ApiProperty() itemName: string;
  @ApiProperty() itemCode: string;
  @ApiProperty() siteId: string;
  @ApiProperty() reorderPoint: number;
  @ApiProperty() maxStockLevel: number;
  @ApiProperty() safetyStock: number;
}
