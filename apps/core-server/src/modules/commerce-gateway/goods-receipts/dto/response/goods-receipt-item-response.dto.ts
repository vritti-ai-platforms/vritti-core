import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CurrencyAmountDto } from '@vritti/api-sdk';

export class GoodsReceiptItemResponseDto {
  @ApiProperty() id: string;
  @ApiProperty() goodsReceiptId: string;
  @ApiProperty() inventoryItemId: string;
  @ApiPropertyOptional({ nullable: true }) inventoryItemName: string | null;
  @ApiProperty({ enum: ['quantity', 'lot', 'lot_serial', 'serial'] })
  inventoryItemTracking: 'quantity' | 'lot' | 'lot_serial' | 'serial';
  @ApiPropertyOptional({ nullable: true }) inventoryItemUomSymbol: string | null;
  @ApiProperty() inventoryItemAllowDecimal: boolean;
  @ApiProperty({ description: 'Ordered (paid) quantity for this item, in the item UOM.' })
  orderedQty: number;
  @ApiProperty({ description: 'Derived free (bonus) quantity from the scheme.' })
  freeQty: number;
  @ApiProperty({
    description: 'Total received quantity = orderedQty + freeQty. Item is balanced when distributed equals this.',
  })
  totalQty: number;
  @ApiPropertyOptional({ nullable: true, description: 'Free-goods scheme buy qty (e.g. 9 in "9+1").' })
  schemeBuyQty: number | null;
  @ApiPropertyOptional({ nullable: true, description: 'Free-goods scheme free qty (e.g. 1 in "9+1").' })
  schemeFreeQty: number | null;
  @ApiProperty({ enum: ['none', 'slab', 'pro_rata'] })
  schemeMode: 'none' | 'slab' | 'pro_rata';
  @ApiProperty({ description: 'Distributed so far — sum(lines.quantity). Item is balanced when this equals totalQty.' })
  acceptedQuantity: number;
  @ApiProperty() rejectedQuantity: number;
  @ApiProperty() lotsCount: number;
  @ApiProperty() linesCount: number;
  @ApiPropertyOptional({ nullable: true }) poOrderedQuantity: number | null;
  @ApiPropertyOptional({ nullable: true }) poReceivedQuantity: number | null;
  @ApiPropertyOptional({ nullable: true }) poRemainingQuantity: number | null;
  @ApiPropertyOptional({ type: () => CurrencyAmountDto, nullable: true }) unitPrice: CurrencyAmountDto | null;
  @ApiPropertyOptional({ type: () => CurrencyAmountDto, nullable: true }) lineTotal: CurrencyAmountDto | null;
  @ApiProperty() metadata: Record<string, unknown>;
  @ApiProperty() createdAt: string;
}
