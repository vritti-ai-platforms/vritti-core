import { ApiProperty } from '@nestjs/swagger';
import { CurrencyAmountDto } from '@vritti/api-sdk/money';

export class GoodsReceiptItemFlagResponseDto {
  @ApiProperty({ enum: ['OVER_RECEIVED', 'SHORT_EXPIRY', 'REJECTED'] })
  code: 'OVER_RECEIVED' | 'SHORT_EXPIRY' | 'REJECTED';

  @ApiProperty({ description: 'What the flag found, in words', example: '2 strips rejected on receipt.' })
  detail: string;
}

export class GoodsReceiptItemResponseDto {
  @ApiProperty({ description: 'Goods receipt item ID' })
  id: string;

  @ApiProperty({ description: 'Goods receipt ID' })
  goodsReceiptId: string;

  @ApiProperty({ description: 'Purchase order line the goods are counted against' })
  purchaseOrderItemId: string;

  @ApiProperty({ description: 'Inbound delivery line the goods arrived on' })
  inboundDeliveryLineId: string;

  @ApiProperty({ description: 'Inventory item ID' })
  inventoryItemId: string;

  @ApiProperty({ description: 'Inventory item name' })
  inventoryItemName: string;

  @ApiProperty({ enum: ['QUANTITY', 'LOT', 'LOT_SERIAL', 'SERIAL'] })
  inventoryItemTracking: 'QUANTITY' | 'LOT' | 'LOT_SERIAL' | 'SERIAL';

  @ApiProperty({ description: 'Unit the goods are counted in — the PO line unit' })
  uomId: string;

  @ApiProperty({ description: 'Symbol of the unit the goods are counted in' })
  uomSymbol: string;

  @ApiProperty({ description: 'Whether that unit allows decimal quantities' })
  uomAllowDecimal: boolean;

  @ApiProperty({ description: "Symbol of the item's primary unit" })
  primaryUomSymbol: string;

  @ApiProperty({ description: 'Quantity received — paid and free together' })
  receivedQty: number;

  @ApiProperty({ description: 'Part of the received quantity rejected on arrival' })
  rejectedQuantity: number;

  @ApiProperty({ description: "Quantity received, in the item's primary unit" })
  receivedPrimaryQty: number;

  @ApiProperty({ description: "Quantity rejected, in the item's primary unit" })
  rejectedPrimaryQty: number;

  @ApiProperty({ description: 'Received less rejected — what goes into stock' })
  acceptedQty: number;

  @ApiProperty({ description: 'Accepted quantity distributed to lines so far; the item is balanced when it is all' })
  distributedQty: number;

  @ApiProperty({ description: 'Quantity ordered on the PO line' })
  orderedQty: number;

  @ApiProperty({
    description: 'Free quantity the PO line scheme gives on the whole ordered quantity, from its primary counter',
  })
  expectedFreeQty: number;

  @ApiProperty({ description: "Accepted on the PO line's posted goods receipts, from its primary counter" })
  alreadyReceivedQty: number;

  @ApiProperty({ type: CurrencyAmountDto, description: 'Unit price agreed on the PO line, in the PO currency' })
  poUnitPrice: CurrencyAmountDto;

  @ApiProperty({ description: 'Number of lots on the item' })
  lotsCount: number;

  @ApiProperty({ description: 'Number of lines the item is distributed to' })
  linesCount: number;

  @ApiProperty({ description: 'Number of lines still waiting for serials' })
  unbalancedLinesCount: number;

  @ApiProperty({
    type: [GoodsReceiptItemFlagResponseDto],
    description: 'Over-receipt, short shelf life and rejection flags — they never block posting',
  })
  flags: GoodsReceiptItemFlagResponseDto[];

  @ApiProperty({ description: 'ISO timestamp of creation' })
  createdAt: string;
}
