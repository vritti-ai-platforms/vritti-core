import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CurrencyAmountDto } from '@vritti/api-sdk/money';

export const SUPPLIER_INVOICE_STATUSES = ['DRAFT', 'POSTED', 'CANCELLED'] as const;
export type SupplierInvoiceStatus = (typeof SUPPLIER_INVOICE_STATUSES)[number];

export const SUPPLIER_INVOICE_FLAG_CODES = [
  'BATCH_NOT_RECEIVED',
  'EXPIRY_DIFFERS',
  'MRP_DIFFERS',
  'BILLED_MORE_THAN_RECEIVED',
  'BILLED_MORE_THAN_ORDERED',
  'PRICE_DIFFERS',
  'FREE_SHORT',
  'SHORT_EXPIRY',
  'RATE_DIFFERS',
] as const;
export type SupplierInvoiceFlagCode = (typeof SUPPLIER_INVOICE_FLAG_CODES)[number];

export class SupplierInvoiceFlagResponseDto {
  @ApiProperty({ description: 'Match check that failed', enum: SUPPLIER_INVOICE_FLAG_CODES })
  code: SupplierInvoiceFlagCode;

  @ApiProperty({ description: 'What differs, for people', example: 'PO INR 20.00, invoice INR 21.00.' })
  detail: string;
}

export class SupplierInvoiceLineReceiptResponseDto {
  @ApiProperty({ description: 'Goods receipt ID' })
  goodsReceiptId: string;

  @ApiProperty({ description: 'Goods receipt number' })
  grNumber: string;

  @ApiPropertyOptional({ description: 'Received batch', type: String, nullable: true })
  lotNumber: string | null;

  @ApiProperty({ description: "Quantity of the receipt the line bills, in the order line's unit" })
  quantity: number;
}

export class SupplierInvoiceLineResponseDto {
  @ApiProperty({ description: 'Line ID' })
  id: string;

  @ApiProperty({ description: 'Invoice ID' })
  supplierInvoiceId: string;

  @ApiProperty({ description: 'Order line billed' })
  purchaseOrderItemId: string;

  @ApiProperty({ description: 'Inventory item ID' })
  inventoryItemId: string;

  @ApiProperty({ description: 'Inventory item name' })
  inventoryItemName: string;

  @ApiProperty({ description: "Order line's unit" })
  uomId: string;

  @ApiPropertyOptional({ description: 'Unit symbol', type: String, nullable: true })
  uomSymbol: string | null;

  @ApiPropertyOptional({ description: 'Batch number', type: String, nullable: true })
  lotNumber: string | null;

  @ApiPropertyOptional({ description: 'Batch expiry date', type: String, nullable: true })
  expiryDate: string | null;

  @ApiProperty({ type: CurrencyAmountDto, description: 'MRP printed on the pack; zero when not given' })
  mrp: CurrencyAmountDto;

  @ApiProperty({ description: 'Quantity billed' })
  billedQty: number;

  @ApiProperty({ description: 'Quantity supplied free' })
  freeQty: number;

  @ApiProperty({ type: CurrencyAmountDto, description: 'Billed price per unit' })
  unitPrice: CurrencyAmountDto;

  @ApiProperty({ type: CurrencyAmountDto, description: 'Discount on the line' })
  discountAmount: CurrencyAmountDto;

  @ApiProperty({ type: CurrencyAmountDto, description: 'Tax on the line' })
  taxAmount: CurrencyAmountDto;

  @ApiProperty({ type: CurrencyAmountDto, description: 'Billed × unit price − discount + tax' })
  lineTotal: CurrencyAmountDto;

  @ApiProperty({
    type: CurrencyAmountDto,
    description: "Final-cost difference on the stock already consumed when posted, in the legal entity's currency",
  })
  varianceAmount: CurrencyAmountDto;

  @ApiProperty({ type: [SupplierInvoiceFlagResponseDto], description: 'Match checks the line fails' })
  flags: SupplierInvoiceFlagResponseDto[];

  @ApiProperty({ type: [SupplierInvoiceLineReceiptResponseDto], description: 'Received stock the line bills' })
  receipts: SupplierInvoiceLineReceiptResponseDto[];
}

export class SupplierInvoiceResponseDto {
  @ApiProperty({ description: 'Invoice ID' })
  id: string;

  @ApiProperty({ description: 'Legal entity ID' })
  legalEntityId: string;

  @ApiProperty({ description: 'Site the billed stock was received at' })
  siteId: string;

  @ApiPropertyOptional({ description: 'Site name', type: String, nullable: true })
  siteName: string | null;

  @ApiPropertyOptional({ description: 'Site code', type: String, nullable: true })
  siteCode: string | null;

  @ApiProperty({ description: 'Supplier ID' })
  supplierId: string;

  @ApiProperty({ description: 'Supplier name' })
  supplierName: string;

  @ApiProperty({ description: 'Purchase order the invoice bills' })
  purchaseOrderId: string;

  @ApiProperty({ description: 'Purchase order number' })
  poNumber: string;

  @ApiProperty({ description: "The supplier's invoice number" })
  invoiceNumber: string;

  @ApiProperty({ description: 'Date on the invoice' })
  invoiceDate: string;

  @ApiProperty({ description: 'Date tax is determined on (YYYY-MM-DD)' })
  taxDate: string;

  @ApiProperty({ description: "Invoice currency, the order's (ISO 4217)", example: 'INR' })
  currencyCode: string;

  @ApiProperty({
    description: "1 unit of the invoice currency in the legal entity's currency; 1 when the two are the same",
  })
  exchangeRate: number;

  @ApiProperty({ description: "The order's exchange rate" })
  poExchangeRate: number;

  @ApiProperty({ description: 'Draft, posted (stock costed) or cancelled', enum: SUPPLIER_INVOICE_STATUSES })
  status: SupplierInvoiceStatus;

  @ApiProperty({ type: CurrencyAmountDto, description: 'Lines billed before discount and tax' })
  subtotal: CurrencyAmountDto;

  @ApiProperty({ type: CurrencyAmountDto, description: 'Discount over the lines' })
  discountAmount: CurrencyAmountDto;

  @ApiProperty({ type: CurrencyAmountDto, description: 'Tax over the lines' })
  taxAmount: CurrencyAmountDto;

  @ApiProperty({ type: CurrencyAmountDto, description: 'Invoice total' })
  totalAmount: CurrencyAmountDto;

  @ApiProperty({ type: [SupplierInvoiceFlagResponseDto], description: 'Match checks the header fails' })
  flags: SupplierInvoiceFlagResponseDto[];

  @ApiProperty({ description: 'Failed match checks over the header and its lines' })
  flagCount: number;

  @ApiProperty({ description: 'Number of lines' })
  lineCount: number;

  @ApiPropertyOptional({ description: 'Internal notes', type: String, nullable: true })
  notes: string | null;

  @ApiPropertyOptional({ description: 'ISO timestamp of posting', type: String, nullable: true })
  postedAt: string | null;

  @ApiProperty({ description: 'Whether the header and lines can be edited (not cancelled)' })
  canEdit: boolean;

  @ApiProperty({ description: 'Whether the invoice can be posted (a draft with lines)' })
  canPost: boolean;

  @ApiProperty({ description: 'Whether the invoice can be cancelled' })
  canCancel: boolean;

  @ApiProperty({ description: 'Whether the invoice can be deleted (a draft)' })
  canDelete: boolean;

  @ApiProperty({ description: 'ISO timestamp of creation' })
  createdAt: string;

  @ApiProperty({ description: 'ISO timestamp of last update' })
  updatedAt: string;
}

export class SupplierInvoiceDetailResponseDto extends SupplierInvoiceResponseDto {
  @ApiProperty({ type: [SupplierInvoiceLineResponseDto], description: 'Billed lines in entry order' })
  lines: SupplierInvoiceLineResponseDto[];
}
