import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

// Node in the unified GR tree: items as roots, then lots/lines based on item.tracking.
export class GoodsReceiptTreeNodeResponseDto {
  @ApiProperty({ description: 'Item ID for items, lot ID for lots, line ID for lines.' })
  id: string;

  @ApiProperty({ description: 'Item name for items, lot number for lots, location name for lines.' })
  name: string;

  @ApiProperty({
    description: 'Depth-encoded path: [itemId] | [itemId, lotId] | [itemId, lotId, lineId].',
    type: [String],
  })
  path: string[];

  @ApiProperty({ enum: ['item', 'lot', 'line'] })
  kind: 'item' | 'lot' | 'line';

  // item-only:
  @ApiPropertyOptional({ enum: ['quantity', 'lot', 'lot_serial', 'serial'] })
  inventoryItemTracking?: 'quantity' | 'lot' | 'lot_serial' | 'serial';

  @ApiPropertyOptional({ description: 'UOM symbol for the inventory item (items only).' })
  inventoryItemUomSymbol?: string;

  @ApiPropertyOptional({ description: 'Sum of all line quantities (items only).' })
  acceptedQuantity?: number;

  @ApiPropertyOptional({ description: 'Damage-on-arrival quantity (items only).' })
  rejectedQuantity?: number;

  @ApiPropertyOptional({ description: 'PO ordered quantity if linked (items only).', nullable: true })
  poOrderedQuantity?: number | null;

  @ApiPropertyOptional({ description: 'PO received quantity if linked (items only).', nullable: true })
  poReceivedQuantity?: number | null;

  @ApiPropertyOptional({ description: 'PO remaining quantity if linked (items only).', nullable: true })
  poRemainingQuantity?: number | null;

  // lot-only:
  @ApiPropertyOptional({ description: 'Sum of line quantities under this lot (lots only).' })
  totalQuantity?: number;

  @ApiPropertyOptional({ description: 'Number of lines under this lot (lots only).' })
  linesCount?: number;

  // line-only:
  @ApiPropertyOptional({ description: 'Line quantity (lines only).' })
  quantity?: number;

  @ApiPropertyOptional({ description: 'Number of serial line items under this line (lines only).' })
  lineItemsCount?: number;

  @ApiProperty({ description: 'True when the node is balanced.' })
  isBalanced: boolean;

  @ApiPropertyOptional({
    description: 'Child nodes (lots under an item, lines under a lot).',
    type: () => GoodsReceiptTreeNodeResponseDto,
    isArray: true,
  })
  children?: GoodsReceiptTreeNodeResponseDto[];
}
