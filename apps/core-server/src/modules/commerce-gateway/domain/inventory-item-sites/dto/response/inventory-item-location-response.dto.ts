import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class InventoryItemLocationResponseDto {
  @ApiProperty() id: string;
  @ApiProperty() inventoryItemId: string;
  @ApiProperty() locationId: string;
  @ApiPropertyOptional({ nullable: true }) locationName: string | null;
  @ApiPropertyOptional({ nullable: true }) locationPath: string | null;
  @ApiProperty({ description: 'Whether new putaway of the item into this location is blocked' }) isBlocked: boolean;
  @ApiProperty() createdAt: string;
  @ApiProperty() updatedAt: string;
}
