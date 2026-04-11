import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class InventoryLevelResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  locationId: string;

  @ApiPropertyOptional({ nullable: true })
  locationName: string | null;

  @ApiProperty()
  stockedQuantity: number;

  @ApiProperty()
  reservedQuantity: number;

  @ApiProperty()
  availableQuantity: number;

  @ApiProperty()
  reorderLevel: number;
}
