import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

// Per-location config for an inventory item — stores reorderLevel per location.
export class InventoryItemLocationResponseDto {
  @ApiProperty() id: string;
  @ApiProperty() inventoryItemId: string;
  @ApiProperty() locationId: string;
  @ApiPropertyOptional({ nullable: true }) locationName: string | null;
  @ApiPropertyOptional({ nullable: true }) locationPath: string | null;
  @ApiProperty() reorderLevel: number;
  @ApiProperty() createdAt: string;
  @ApiProperty() updatedAt: string;
}
