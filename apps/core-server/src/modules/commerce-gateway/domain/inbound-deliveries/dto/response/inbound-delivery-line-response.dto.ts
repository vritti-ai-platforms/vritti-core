import { ApiProperty } from '@nestjs/swagger';

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

  @ApiProperty({
    description: 'Receipt status of the purchase order',
    enum: ['NOT_RECEIVED', 'PARTIAL', 'RECEIVED'],
  })
  poReceiptStatus: string;

  @ApiProperty({ description: 'Inventory item ordered' })
  inventoryItemId: string;

  @ApiProperty({ description: 'Inventory item name' })
  inventoryItemName: string;

  @ApiProperty({ description: 'Unit the PO line is ordered in — every quantity on the line is in it' })
  uomId: string;

  @ApiProperty({ description: 'Unit symbol' })
  uomSymbol: string;

  @ApiProperty({ description: 'Whether the unit takes fractional quantities' })
  allowDecimal: boolean;

  @ApiProperty({ description: 'Due on the PO line: ordered + free − cancelled' })
  orderedQty: number;

  @ApiProperty({ description: 'Accepted on all posted receipts of the PO line' })
  poReceivedQty: number;

  @ApiProperty({ description: 'Quantity on this delivery' })
  quantity: number;

  @ApiProperty({ description: "Quantity on this delivery, in the item's primary unit" })
  primaryUomQty: number;

  @ApiProperty({ description: 'Accepted on posted receipts of this delivery line' })
  receivedOnDeliveryQty: number;

  @ApiProperty({ description: "Accepted on posted receipts of this delivery line, in the item's primary unit" })
  receivedOnDeliveryPrimaryQty: number;

  @ApiProperty({ description: 'Delivery quantity less accepted on this delivery line' })
  openQty: number;

  @ApiProperty({
    description: "The most the line's quantity may be raised to after the PO line's receipts and other deliveries",
  })
  maxQuantity: number;

  @ApiProperty({ description: 'ISO timestamp of creation' })
  createdAt: string;
}
