import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CurrencyAmountDto } from '@vritti/api-sdk/money';

export class PurchaseOrderItemResponseDto {
  @ApiProperty({ description: 'Purchase order item ID' })
  id: string;

  @ApiProperty({ description: 'Purchase order ID' })
  purchaseOrderId: string;

  @ApiProperty({ description: 'Inventory item ID' })
  inventoryItemId: string;

  @ApiProperty({ description: 'Inventory item name' })
  inventoryItemName: string;

  @ApiProperty({
    description: 'Date the line is expected to be delivered (YYYY-MM-DD); set by its inbound deliveries while on any',
  })
  expectedDeliveryDate: string;

  @ApiProperty({
    description:
      'Numbers of the non-cancelled inbound deliveries the line is on; its expected delivery is read-only while any',
    type: [String],
  })
  inboundDeliveryNumbers: string[];

  @ApiProperty({
    description: 'IDs of the non-cancelled inbound deliveries the line is on, in the order of inboundDeliveryNumbers',
    type: [String],
  })
  inboundDeliveryIds: string[];

  @ApiProperty({ description: 'Date tax is determined on for the line (YYYY-MM-DD)' })
  taxDate: string;

  @ApiProperty({ description: "True when the line has its own tax date instead of following the purchase order's" })
  isTaxDateOverridden: boolean;

  @ApiProperty({ description: 'True once a published goods receipt or a posted supplier invoice counts the line' })
  isTaxDateLocked: boolean;

  @ApiProperty({ description: 'Unit the line is ordered in' })
  uomId: string;

  @ApiPropertyOptional({ description: 'Symbol of the unit the line is ordered in', nullable: true })
  orderUomSymbol: string | null;

  @ApiProperty({ description: 'Ordered quantity in the line unit' })
  uomQty: number;

  @ApiProperty({ description: 'Free quantity the scheme gives on the whole ordered quantity, in the line unit' })
  expectedFreeQty: number;

  @ApiProperty({ description: 'Accepted (received less rejected) on published goods receipts, in the line unit' })
  receivedQty: number;

  @ApiProperty({ description: "Ordered quantity in the item's primary unit" })
  primaryUomQty: number;

  @ApiProperty({ description: "Expected free quantity in the item's primary unit" })
  expectedFreePrimaryQty: number;

  @ApiProperty({ description: "Received quantity in the item's primary unit" })
  receivedPrimaryQty: number;

  @ApiPropertyOptional({ description: "Symbol of the item's primary unit", nullable: true })
  primaryUomSymbol: string | null;

  @ApiProperty({ description: 'Line currency code (ISO 4217) — the PO currency' })
  currencyCode: string;

  @ApiProperty({ type: CurrencyAmountDto, description: 'Unit price in the PO currency' })
  unitPrice: CurrencyAmountDto;

  @ApiProperty({ type: CurrencyAmountDto, description: "Line total spread over the item's primary unit" })
  primaryUomUnitPrice: CurrencyAmountDto;

  @ApiProperty({ type: CurrencyAmountDto, description: 'Line total in the PO currency' })
  totalPrice: CurrencyAmountDto;

  @ApiPropertyOptional({
    type: CurrencyAmountDto,
    nullable: true,
    description:
      "The supplier item's own price when it is in another currency than the PO; unitPrice is its conversion",
  })
  sourceUnitPrice: CurrencyAmountDto | null;

  @ApiPropertyOptional({ description: 'Free-goods scheme buy qty (e.g. 9 in "9+1").', nullable: true })
  schemeBuyQty: number | null;

  @ApiPropertyOptional({ description: 'Free-goods scheme free qty (e.g. 1 in "9+1").', nullable: true })
  schemeFreeQty: number | null;

  @ApiProperty({ description: 'Whether a free-goods scheme applies.' })
  hasScheme: boolean;
}
