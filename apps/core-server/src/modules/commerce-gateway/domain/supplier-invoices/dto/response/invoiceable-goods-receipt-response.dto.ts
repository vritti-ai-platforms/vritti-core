import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CurrencyAmountDto } from '@vritti/api-sdk/money';

export class InvoiceableGoodsReceiptResponseDto {
  @ApiProperty({ description: 'Goods receipt ID' })
  goodsReceiptId: string;

  @ApiProperty({ description: 'Goods receipt number', example: 'GR-202611-0004' })
  grNumber: string;

  @ApiProperty({ description: 'Date received (YYYY-MM-DD)' })
  receivedDate: string;

  @ApiProperty({ description: 'Receipt item ID' })
  goodsReceiptItemId: string;

  @ApiPropertyOptional({ description: 'Receipt lot ID; null for an item without lots', type: String, nullable: true })
  goodsReceiptLotId: string | null;

  @ApiPropertyOptional({ description: 'Batch number', type: String, nullable: true })
  lotNumber: string | null;

  @ApiPropertyOptional({ description: 'Batch expiry date', type: String, nullable: true })
  expiryDate: string | null;

  @ApiProperty({ type: CurrencyAmountDto, description: "The lot's MRP in the legal entity's currency; zero when none" })
  mrp: CurrencyAmountDto;

  @ApiProperty({ description: 'Purchase order ID' })
  purchaseOrderId: string;

  @ApiProperty({ description: 'Purchase order number' })
  poNumber: string;

  @ApiProperty({ description: 'Order line received' })
  purchaseOrderItemId: string;

  @ApiProperty({ description: 'Inventory item ID' })
  inventoryItemId: string;

  @ApiProperty({ description: 'Inventory item name' })
  inventoryItemName: string;

  @ApiProperty({ description: "Order line's unit" })
  uomId: string;

  @ApiProperty({ description: "Symbol of the order line's unit" })
  uomSymbol: string;

  @ApiProperty({ description: "Symbol of the item's primary unit" })
  primaryUomSymbol: string;

  @ApiProperty({ type: CurrencyAmountDto, description: "Order line's unit price in the PO currency" })
  poUnitPrice: CurrencyAmountDto;

  @ApiProperty({ description: "The order's exchange rate into the legal entity's currency" })
  poExchangeRate: number;

  @ApiProperty({ description: "Quantity the receipt accepted, in the item's primary unit" })
  acceptedPrimaryQty: number;

  @ApiProperty({ description: 'Quantity on live (non-cancelled) invoice lines, drafts included, in primary units' })
  invoicedPrimaryQty: number;

  @ApiProperty({ description: 'Accepted less invoiced, in primary units' })
  openPrimaryQty: number;

  @ApiProperty({ description: "Accepted less invoiced, in the order line's unit" })
  openQty: number;
}
