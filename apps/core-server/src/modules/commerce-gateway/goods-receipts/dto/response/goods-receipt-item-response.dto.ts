import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class GoodsReceiptItemResponseDto {
  @ApiProperty() id: string;
  @ApiProperty() goodsReceiptId: string;
  @ApiProperty() inventoryItemId: string;
  @ApiPropertyOptional({ nullable: true }) inventoryItemName: string | null;
  @ApiProperty({ enum: ['quantity', 'lot', 'serial'] })
  inventoryItemTracking: 'quantity' | 'lot' | 'serial';
  @ApiPropertyOptional({ nullable: true }) inventoryItemUomSymbol: string | null;
  @ApiProperty({ description: 'Derived from sum(lines.quantity).' })
  acceptedQuantity: number;
  @ApiProperty() rejectedQuantity: number;
  @ApiProperty() lotsCount: number;
  @ApiProperty() linesCount: number;
  @ApiProperty() isBalanced: boolean;
  @ApiPropertyOptional({ nullable: true }) poOrderedQuantity: number | null;
  @ApiPropertyOptional({ nullable: true }) poReceivedQuantity: number | null;
  @ApiPropertyOptional({ nullable: true }) poRemainingQuantity: number | null;
  @ApiProperty() metadata: Record<string, unknown>;
  @ApiProperty() createdAt: string;
}
