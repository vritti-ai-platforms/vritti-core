import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class InboundDeliveryLineResponseDto {
  @ApiProperty({ description: 'Delivery line ID' })
  id: string;

  @ApiProperty({ description: 'Inbound delivery the line is on' })
  inboundDeliveryId: string;

  @ApiProperty({ description: 'Purchase order line delivered' })
  purchaseOrderItemId: string;

  @ApiProperty({ description: 'Purchase order of the line' })
  purchaseOrderId: string;

  @ApiProperty({ description: 'PO number', example: 'PO-202611-0001' })
  poNumber: string;

  @ApiProperty({ description: 'Status of the purchase order' })
  poStatus: string;

  @ApiProperty({ description: 'Inventory item ordered' })
  inventoryItemId: string;

  @ApiProperty({ description: 'Inventory item name' })
  inventoryItemName: string;

  @ApiProperty({ description: 'Unit the PO line is ordered in — every quantity on the line is in it' })
  uomId: string;

  @ApiPropertyOptional({ description: 'Unit symbol', nullable: true })
  uomSymbol: string | null;

  @ApiProperty({ description: 'Whether the unit takes fractional quantities' })
  allowDecimal: boolean;

  @ApiProperty({ description: 'Ordered on the PO line, paid and free together' })
  orderedQty: number;

  @ApiProperty({ description: 'Accepted on all published receipts of the PO line' })
  poReceivedQty: number;

  @ApiProperty({ description: 'Quantity announced on this delivery' })
  quantity: number;

  @ApiProperty({ description: 'Accepted on published receipts against this delivery' })
  receivedOnDeliveryQty: number;

  @ApiProperty({ description: 'Still to receive against this delivery' })
  openQty: number;

  @ApiProperty({
    description: "The most the line's quantity may be raised to after the PO line's receipts and other deliveries",
  })
  maxQuantity: number;

  @ApiProperty({ description: 'ISO timestamp of creation' })
  createdAt: string;
}
