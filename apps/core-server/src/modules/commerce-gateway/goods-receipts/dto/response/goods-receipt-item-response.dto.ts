import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class GoodsReceiptItemResponseDto {
  @ApiProperty() id: string;
  @ApiProperty() goodsReceiptId: string;
  @ApiProperty() inventoryItemId: string;
  @ApiPropertyOptional({ nullable: true }) inventoryItemName: string | null;
  @ApiProperty({ enum: ['quantity', 'lot', 'lot_serial', 'serial'] })
  inventoryItemTracking: 'quantity' | 'lot' | 'lot_serial' | 'serial';
  @ApiPropertyOptional({ nullable: true }) inventoryItemUomSymbol: string | null;
  @ApiProperty() inventoryItemAllowDecimal: boolean;
  @ApiProperty({ description: 'Operator-declared accepted quantity for this item.' })
  quantity: number;
  @ApiProperty({ description: 'Distributed so far — sum(lines.quantity). Item is balanced when this equals quantity.' })
  acceptedQuantity: number;
  @ApiProperty() rejectedQuantity: number;
  @ApiProperty() lotsCount: number;
  @ApiProperty() linesCount: number;
  @ApiPropertyOptional({ nullable: true }) poOrderedQuantity: number | null;
  @ApiPropertyOptional({ nullable: true }) poReceivedQuantity: number | null;
  @ApiPropertyOptional({ nullable: true }) poRemainingQuantity: number | null;
  @ApiProperty() metadata: Record<string, unknown>;
  @ApiProperty() createdAt: string;
}
