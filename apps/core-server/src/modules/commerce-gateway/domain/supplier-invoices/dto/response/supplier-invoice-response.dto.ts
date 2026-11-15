import { PurchaseReferenceResponseDto } from '@commerce/purchases/dto/response/purchase-reference-response.dto';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CurrencyAmountDto } from '@vritti/api-sdk/money';

export const SUPPLIER_INVOICE_STATUSES = ['DRAFT', 'POSTED', 'CANCELLED'] as const;
export type SupplierInvoiceStatus = (typeof SUPPLIER_INVOICE_STATUSES)[number];

export const SUPPLIER_INVOICE_SOURCES = ['ENTERED', 'SELF_INVOICED'] as const;
export type SupplierInvoiceSource = (typeof SUPPLIER_INVOICE_SOURCES)[number];

export const SUPPLIER_INVOICE_PAYMENT_STATUSES = ['UNPAID', 'PARTIAL', 'PAID'] as const;
export type SupplierInvoicePaymentStatus = (typeof SUPPLIER_INVOICE_PAYMENT_STATUSES)[number];

export const SUPPLIER_INVOICE_LINE_TYPES = ['ITEM', 'CHARGE'] as const;
export type SupplierInvoiceLineType = (typeof SUPPLIER_INVOICE_LINE_TYPES)[number];

export const SUPPLIER_INVOICE_HOLD_CODES = [
  'PRICE_DIFFERS',
  'INVOICED_MORE_THAN_ORDERED',
  'FREE_SHORT',
  'RATE_DIFFERS',
  'SHORT_EXPIRY',
  'QTY_NOT_RECEIVED',
  'QTY_NOT_RELEASED',
] as const;
export type SupplierInvoiceHoldCode = (typeof SUPPLIER_INVOICE_HOLD_CODES)[number];

export const SUPPLIER_INVOICE_HOLD_STATUSES = ['OPEN', 'RELEASED', 'RESOLVED'] as const;
export type SupplierInvoiceHoldStatus = (typeof SUPPLIER_INVOICE_HOLD_STATUSES)[number];

export class SupplierInvoiceHoldResponseDto {
  @ApiProperty({ description: 'Hold ID' })
  id: string;

  @ApiProperty({ description: 'Invoice ID' })
  supplierInvoiceId: string;

  @ApiPropertyOptional({ description: 'Line the hold is on; null for a header hold', type: String, nullable: true })
  supplierInvoiceLineId: string | null;

  @ApiProperty({ description: 'Match check that raised the hold', enum: SUPPLIER_INVOICE_HOLD_CODES })
  code: SupplierInvoiceHoldCode;

  @ApiProperty({ description: 'What differs, for people', example: 'PO INR 20.00, invoice INR 21.00.' })
  detail: string;

  @ApiProperty({ description: 'Whether the hold stops payment while open; SHORT_EXPIRY is information only' })
  blocksPayment: boolean;

  @ApiProperty({
    description: 'OPEN until released by a person or resolved when its cause goes away',
    enum: SUPPLIER_INVOICE_HOLD_STATUSES,
  })
  status: SupplierInvoiceHoldStatus;

  @ApiPropertyOptional({ description: 'User who released the hold', type: String, nullable: true })
  releasedBy: string | null;

  @ApiPropertyOptional({ description: 'ISO timestamp of release', type: String, nullable: true })
  releasedAt: string | null;

  @ApiPropertyOptional({ description: 'Why the hold was released', type: String, nullable: true })
  releaseReason: string | null;

  @ApiProperty({ description: 'ISO timestamp of creation' })
  createdAt: string;

  @ApiProperty({ description: 'ISO timestamp of last update' })
  updatedAt: string;
}

export class SupplierInvoiceLineResponseDto {
  @ApiProperty({ description: 'Line ID' })
  id: string;

  @ApiProperty({ description: 'Invoice ID' })
  supplierInvoiceId: string;

  @ApiProperty({
    description: 'ITEM invoices received stock, CHARGE is a landed cost',
    enum: SUPPLIER_INVOICE_LINE_TYPES,
  })
  lineType: SupplierInvoiceLineType;

  @ApiPropertyOptional({ description: 'Order line invoiced', type: String, nullable: true })
  purchaseOrderItemId: string | null;

  @ApiPropertyOptional({ description: 'Purchase order of that line', type: String, nullable: true })
  purchaseOrderId: string | null;

  @ApiPropertyOptional({ description: 'Purchase order number', type: String, nullable: true })
  poNumber: string | null;

  @ApiPropertyOptional({ description: 'Receipt item invoiced', type: String, nullable: true })
  goodsReceiptItemId: string | null;

  @ApiPropertyOptional({ description: 'Goods receipt of that item', type: String, nullable: true })
  goodsReceiptId: string | null;

  @ApiPropertyOptional({ description: 'Goods receipt number', type: String, nullable: true })
  grNumber: string | null;

  @ApiPropertyOptional({ description: 'Receipt lot invoiced', type: String, nullable: true })
  goodsReceiptLotId: string | null;

  @ApiPropertyOptional({ description: "Batch number, the receipt lot's", type: String, nullable: true })
  lotNumber: string | null;

  @ApiPropertyOptional({ description: "Batch expiry date, the receipt lot's", type: String, nullable: true })
  expiryDate: string | null;

  @ApiProperty({
    type: CurrencyAmountDto,
    description: "The receipt lot's MRP in the legal entity's currency; zero when none",
  })
  mrp: CurrencyAmountDto;

  @ApiPropertyOptional({ description: 'Inventory item ID', type: String, nullable: true })
  inventoryItemId: string | null;

  @ApiPropertyOptional({ description: 'Inventory item name', type: String, nullable: true })
  inventoryItemName: string | null;

  @ApiPropertyOptional({ description: "Order line's unit", type: String, nullable: true })
  uomId: string | null;

  @ApiPropertyOptional({ description: "Symbol of the order line's unit", type: String, nullable: true })
  uomSymbol: string | null;

  @ApiPropertyOptional({ description: "Symbol of the item's primary unit", type: String, nullable: true })
  primaryUomSymbol: string | null;

  @ApiPropertyOptional({ description: "Quantity invoiced, in the order line's unit", type: Number, nullable: true })
  invoicedQty: number | null;

  @ApiPropertyOptional({
    description: "Quantity supplied free, in the order line's unit",
    type: Number,
    nullable: true,
  })
  freeQty: number | null;

  @ApiPropertyOptional({ description: "Quantity invoiced, in the item's primary unit", type: Number, nullable: true })
  invoicedPrimaryQty: number | null;

  @ApiPropertyOptional({
    description: "Quantity supplied free, in the item's primary unit",
    type: Number,
    nullable: true,
  })
  freePrimaryQty: number | null;

  @ApiPropertyOptional({ description: 'Cost category charged', type: String, nullable: true })
  costCategoryId: string | null;

  @ApiPropertyOptional({ description: 'Cost category name', type: String, nullable: true })
  costCategoryName: string | null;

  @ApiPropertyOptional({ description: 'Line description', type: String, nullable: true })
  description: string | null;

  @ApiProperty({ type: CurrencyAmountDto, description: 'Invoiced price per unit, or the charge amount' })
  unitPrice: CurrencyAmountDto;

  @ApiProperty({ type: CurrencyAmountDto, description: 'Discount on the line' })
  discountAmount: CurrencyAmountDto;

  @ApiProperty({ type: CurrencyAmountDto, description: 'Tax on the line' })
  taxAmount: CurrencyAmountDto;

  @ApiProperty({ type: CurrencyAmountDto, description: 'Invoiced × unit price − discount + tax' })
  lineTotal: CurrencyAmountDto;

  @ApiProperty({
    type: CurrencyAmountDto,
    description: "Final-cost difference on the stock already consumed when posted, in the legal entity's currency",
  })
  varianceAmount: CurrencyAmountDto;

  @ApiProperty({ type: [SupplierInvoiceHoldResponseDto], description: "The line's holds, every status" })
  holds: SupplierInvoiceHoldResponseDto[];
}

export class SupplierInvoiceResponseDto {
  @ApiProperty({ description: 'Invoice ID' })
  id: string;

  @ApiProperty({ description: 'Legal entity ID' })
  legalEntityId: string;

  @ApiProperty({ description: 'Site the invoiced stock was received at' })
  siteId: string;

  @ApiProperty({ description: 'Site name' })
  siteName: string;

  @ApiProperty({ description: 'Site code' })
  siteCode: string;

  @ApiProperty({ description: 'Supplier ID' })
  supplierId: string;

  @ApiProperty({ description: 'Supplier name' })
  supplierName: string;

  @ApiProperty({ description: 'Numbers of the purchase orders its lines invoice', type: [String] })
  poNumbers: string[];

  @ApiProperty({
    type: [PurchaseReferenceResponseDto],
    description: 'Purchases whose purchase orders its lines invoice',
  })
  purchases: PurchaseReferenceResponseDto[];

  @ApiProperty({
    description: 'Whether it is a Receive with Invoice, edited, posted and discarded only through its purchases',
  })
  isReceiveWithInvoice: boolean;

  @ApiProperty({ description: "The supplier's invoice number" })
  invoiceNumber: string;

  @ApiProperty({ description: 'Date on the invoice (YYYY-MM-DD)' })
  invoiceDate: string;

  @ApiProperty({ description: 'Date tax is determined on (YYYY-MM-DD)' })
  taxDate: string;

  @ApiProperty({ description: "Entered from the supplier's document or self-invoiced", enum: SUPPLIER_INVOICE_SOURCES })
  source: SupplierInvoiceSource;

  @ApiProperty({ description: "Invoice currency, one of the supplier's (ISO 4217)", example: 'INR' })
  currencyCode: string;

  @ApiProperty({
    description: "1 unit of the invoice currency in the legal entity's currency; 1 when the two are the same",
  })
  exchangeRate: number;

  @ApiProperty({ description: "Payment term, from the supplier's enrollment at the site" })
  paymentTermId: string;

  @ApiPropertyOptional({ description: 'Payment term name', type: String, nullable: true })
  paymentTermName: string | null;

  @ApiProperty({ description: "Due date (YYYY-MM-DD), the term's last instalment from its baseline" })
  dueDate: string;

  @ApiProperty({ description: 'Draft, posted (stock costed) or cancelled', enum: SUPPLIER_INVOICE_STATUSES })
  status: SupplierInvoiceStatus;

  @ApiProperty({ description: 'How much of the invoice is paid', enum: SUPPLIER_INVOICE_PAYMENT_STATUSES })
  paymentStatus: SupplierInvoicePaymentStatus;

  @ApiProperty({ type: CurrencyAmountDto, description: 'Lines invoiced before discount and tax' })
  subtotal: CurrencyAmountDto;

  @ApiProperty({ type: CurrencyAmountDto, description: 'Discount over the lines' })
  discountAmount: CurrencyAmountDto;

  @ApiProperty({ type: CurrencyAmountDto, description: 'Tax over the lines' })
  taxAmount: CurrencyAmountDto;

  @ApiProperty({ type: CurrencyAmountDto, description: 'Invoice total' })
  totalAmount: CurrencyAmountDto;

  @ApiProperty({ description: 'Open holds that block payment' })
  openHoldCount: number;

  @ApiProperty({ description: 'Number of lines' })
  lineCount: number;

  @ApiPropertyOptional({ description: 'Internal notes', type: String, nullable: true })
  notes: string | null;

  @ApiPropertyOptional({ description: 'ISO timestamp of posting', type: String, nullable: true })
  postedAt: string | null;

  @ApiProperty({
    description: "Posted, with no open blocking hold and the supplier's payments not blocked",
  })
  isPayable: boolean;

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
  @ApiProperty({ type: [SupplierInvoiceLineResponseDto], description: 'Item and charge lines in entry order' })
  lines: SupplierInvoiceLineResponseDto[];

  @ApiProperty({ type: [SupplierInvoiceHoldResponseDto], description: 'Every hold of the invoice and its lines' })
  holds: SupplierInvoiceHoldResponseDto[];
}
