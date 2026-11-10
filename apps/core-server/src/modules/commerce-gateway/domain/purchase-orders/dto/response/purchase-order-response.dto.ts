import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CurrencyAmountDto } from '@vritti/api-sdk/money';

export class PurchaseOrderResponseDto {
  @ApiProperty({ description: 'Purchase order ID' })
  id: string;

  @ApiProperty({ description: 'Legal entity the purchase order belongs to' })
  legalEntityId: string;

  @ApiProperty({ description: 'Site the purchase order is raised for' })
  siteId: string;

  @ApiProperty({ description: 'Supplier ID' })
  supplierId: string;

  @ApiProperty({ description: 'Supplier name' })
  supplierName: string;

  @ApiProperty({ description: 'PO number', example: 'PO-202611-0001' })
  poNumber: string;

  @ApiProperty({
    description: 'PO status',
    enum: ['DRAFT', 'SENT', 'CONFIRMED', 'PARTIALLY_RECEIVED', 'RECEIVED', 'CLOSED', 'CANCELLED'],
  })
  status: string;

  @ApiProperty({ description: "PO currency code (ISO 4217) — one of the supplier's currencies", example: 'USD' })
  currencyCode: string;

  @ApiProperty({
    description: "1 unit of the PO currency in the legal entity's currency; 1 when the PO is in that currency",
    example: 83.5,
  })
  exchangeRate: number;

  @ApiProperty({
    description: "Rates from the supplier's other currencies into the PO currency, as decimal strings",
    example: { USD: '83.250000' },
    type: 'object',
    additionalProperties: { type: 'string' },
  })
  conversionRates: Record<string, string>;

  @ApiProperty({ description: 'Order date (YYYY-MM-DD)' })
  orderDate: string;

  @ApiProperty({ description: 'Date tax is determined on (YYYY-MM-DD); lines follow it unless overridden' })
  taxDate: string;

  @ApiPropertyOptional({
    description: 'Latest date one of the lines is expected to be delivered (YYYY-MM-DD); null without lines',
    nullable: true,
  })
  latestExpectedDeliveryDate: string | null;

  @ApiProperty({ description: 'IANA timezone of the site the PO was raised for', example: 'Asia/Kolkata' })
  timezone: string;

  @ApiPropertyOptional({ description: 'Notes', nullable: true })
  notes: string | null;

  @ApiProperty({ type: CurrencyAmountDto, description: 'Sum of the line totals in the PO currency' })
  totalAmount: CurrencyAmountDto;

  @ApiProperty({
    description: 'True once a goods receipt of the PO is published; its supplier, prices and rates are then locked',
  })
  hasPublishedGoodsReceipt: boolean;

  @ApiProperty({ description: 'ISO timestamp of creation' })
  createdAt: string;

  @ApiProperty({ description: 'ISO timestamp of last update' })
  updatedAt: string;
}
