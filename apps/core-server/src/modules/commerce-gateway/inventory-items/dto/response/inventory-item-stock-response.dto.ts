import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class InventoryItemStockResponseDto {
  @ApiProperty() locationId: string;
  @ApiPropertyOptional({ nullable: true }) locationName: string | null;
  @ApiPropertyOptional({ nullable: true }) locationPath: string | null;
  @ApiProperty() stockedQuantity: number;
  @ApiProperty() reservedQuantity: number;
  @ApiProperty() availableQuantity: number;
  @ApiPropertyOptional({ nullable: true }) reorderLevel: number | null;
}
