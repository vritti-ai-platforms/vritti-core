import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

// Node in the OPENING+serial tree: lots as roots, lines as children.
export class StockAdjustmentTreeNodeResponseDto {
  @ApiProperty({ description: 'Lot ID for lots, line ID for lines.' })
  id: string;

  @ApiProperty({ description: 'Lot number for lots, location name for lines.' })
  name: string;

  @ApiProperty({
    description: 'Depth-encoded path: [lotId] for a lot, [lotId, lineId] for a line.',
    type: [String],
  })
  path: string[];

  @ApiProperty({ enum: ['lot', 'line'] })
  kind: 'lot' | 'line';

  @ApiPropertyOptional({ description: 'Total quantity (lots only).' })
  totalQuantity?: number;

  @ApiPropertyOptional({ description: 'Lines under this lot (lots only).' })
  linesCount?: number;

  @ApiPropertyOptional({ description: 'Line quantity in the line UOM (lines only).' })
  uomQty?: number;

  @ApiPropertyOptional({ description: 'Serials added to this line (lines only).' })
  lineItemsCount?: number;

  @ApiProperty({ description: 'True when the node is balanced.' })
  isBalanced: boolean;

  @ApiPropertyOptional({
    description: 'Child nodes (lines under a lot).',
    type: () => StockAdjustmentTreeNodeResponseDto,
    isArray: true,
  })
  children?: StockAdjustmentTreeNodeResponseDto[];
}
