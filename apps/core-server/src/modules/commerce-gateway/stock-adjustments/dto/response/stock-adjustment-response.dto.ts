import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class StockAdjustmentResponseDto {
  @ApiProperty({ description: 'Stock adjustment ID' })
  id: string;

  @ApiProperty({ description: 'Inventory item ID' })
  inventoryItemId: string;

  @ApiPropertyOptional({ description: 'Inventory item name', nullable: true })
  inventoryItemName: string | null;

  @ApiProperty({ description: 'Adjustment type', example: 'WASTE' })
  type: string;

  @ApiProperty({ description: 'Adjustment quantity' })
  quantity: number;

  @ApiPropertyOptional({ description: 'Reason for adjustment', nullable: true })
  reason: string | null;

  @ApiPropertyOptional({ description: 'User ID who performed the adjustment', nullable: true })
  adjustedBy: string | null;

  @ApiProperty({ description: 'ISO timestamp of creation' })
  createdAt: string;
}
