import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CurrencyAmountDto } from '@vritti/api-sdk/money';

export const PURCHASE_ORDER_STATUSES = ['DRAFT', 'SENT', 'CONFIRMED', 'DELIVERY_COMPLETED', 'CANCELLED'] as const;
export type PurchaseOrderStatus = (typeof PURCHASE_ORDER_STATUSES)[number];

export const PURCHASE_ORDER_RECEIPT_STATUSES = ['NOT_RECEIVED', 'PARTIAL', 'RECEIVED'] as const;
export type PurchaseOrderReceiptStatus = (typeof PURCHASE_ORDER_RECEIPT_STATUSES)[number];

export const PURCHASE_ORDER_INVOICE_STATUSES = ['NOTHING_TO_INVOICE', 'TO_INVOICE', 'PARTIAL', 'INVOICED'] as const;
export type PurchaseOrderInvoiceStatus = (typeof PURCHASE_ORDER_INVOICE_STATUSES)[number];

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

  @ApiProperty({ description: 'PO status in its manual workflow', enum: PURCHASE_ORDER_STATUSES })
  status: PurchaseOrderStatus;

  @ApiProperty({
    description: 'How much of the order posted goods receipts accepted',
    enum: PURCHASE_ORDER_RECEIPT_STATUSES,
  })
  receiptStatus: PurchaseOrderReceiptStatus;

  @ApiProperty({
    description: 'How much of what was received posted supplier invoices cover',
    enum: PURCHASE_ORDER_INVOICE_STATUSES,
  })
  invoiceStatus: PurchaseOrderInvoiceStatus;

  @ApiProperty({ description: "Payment term, from the supplier's enrollment at the order's site" })
  paymentTermId: string;

  @ApiPropertyOptional({ description: 'Purchase that created the order', type: String, nullable: true })
  purchaseId: string | null;

  @ApiPropertyOptional({ description: 'Number of that purchase', type: String, nullable: true })
  purchaseNumber: string | null;

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
    description: 'True once a goods receipt of the PO is posted; its supplier, prices and rates are then locked',
  })
  hasPostedGoodsReceipt: boolean;

  @ApiProperty({ description: 'ISO timestamp of creation' })
  createdAt: string;

  @ApiProperty({ description: 'ISO timestamp of last update' })
  updatedAt: string;
}
