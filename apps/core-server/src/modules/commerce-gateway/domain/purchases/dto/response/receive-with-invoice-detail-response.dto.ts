import { SupplierInvoiceHoldResponseDto } from '@commerce/supplier-invoices/dto/response/supplier-invoice-response.dto';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CurrencyAmountDto } from '@vritti/api-sdk/money';
import { PurchaseReferenceResponseDto } from './purchase-reference-response.dto';

export const RECEIVE_WITH_INVOICE_STATUSES = ['DRAFT', 'POSTED'] as const;
export type ReceiveWithInvoiceStatus = (typeof RECEIVE_WITH_INVOICE_STATUSES)[number];

export class ReceiveWithInvoiceGoodsReceiptResponseDto {
  @ApiProperty({ description: 'Goods receipt ID' })
  id: string;

  @ApiProperty({ description: 'GR number', example: 'GR-202611-0001' })
  grNumber: string;
}

export class ReceiveWithInvoiceLineResponseDto {
  @ApiProperty({ description: 'Allocation the line receives and invoices' })
  allocationId: string;

  @ApiProperty({ description: 'Purchase the allocation belongs to' })
  purchaseId: string;

  @ApiProperty({ description: 'Number of that purchase', example: 'PUR-202611-0001' })
  purchaseNumber: string;

  @ApiProperty({ description: 'Inventory item name' })
  inventoryItemName: string;

  @ApiPropertyOptional({ description: "Symbol of the allocation's unit", type: String, nullable: true })
  uomSymbol: string | null;

  @ApiProperty({ description: 'Whether a batch number and expiry are required' })
  isLotTracked: boolean;

  @ApiProperty({ description: "Quantity invoiced, in the allocation's unit" })
  quantity: number;

  @ApiProperty({ description: "Quantity supplied free, in the allocation's unit" })
  freeQty: number;

  @ApiProperty({ type: () => CurrencyAmountDto, description: 'Invoiced price per unit, in the invoice currency' })
  unitPrice: CurrencyAmountDto;

  @ApiProperty({ type: () => CurrencyAmountDto, description: 'Discount on the line; zero when none' })
  discountAmount: CurrencyAmountDto;

  @ApiProperty({ type: () => CurrencyAmountDto, description: 'Tax on the line; zero when none' })
  taxAmount: CurrencyAmountDto;

  @ApiPropertyOptional({ type: String, description: 'Batch number', nullable: true })
  lotNumber: string | null;

  @ApiPropertyOptional({ type: String, description: 'Batch expiry date (YYYY-MM-DD)', nullable: true })
  expiryDate: string | null;

  @ApiPropertyOptional({ type: String, description: 'Batch manufacturing date (YYYY-MM-DD)', nullable: true })
  manufacturingDate: string | null;

  @ApiProperty({
    type: () => CurrencyAmountDto,
    description: "Printed MRP, in the legal entity's currency; zero when none",
  })
  mrp: CurrencyAmountDto;

  @ApiPropertyOptional({ type: String, description: 'Site location the goods are put at', nullable: true })
  locationId: string | null;
}

export class ReceiveWithInvoiceDetailResponseDto {
  @ApiProperty({ description: 'Supplier invoice ID of the Receive with Invoice' })
  supplierInvoiceId: string;

  @ApiProperty({ description: 'Draft until posted', enum: RECEIVE_WITH_INVOICE_STATUSES })
  status: ReceiveWithInvoiceStatus;

  @ApiProperty({ description: 'Site the goods were received at' })
  siteId: string;

  @ApiProperty({ description: 'Supplier whose invoice it is' })
  supplierId: string;

  @ApiProperty({ description: 'Supplier name' })
  supplierName: string;

  @ApiProperty({ description: "The supplier's invoice number" })
  invoiceNumber: string;

  @ApiProperty({ description: 'Date on the invoice (YYYY-MM-DD)' })
  invoiceDate: string;

  @ApiPropertyOptional({ type: String, description: 'Date tax is determined on (YYYY-MM-DD)', nullable: true })
  taxDate: string | null;

  @ApiProperty({ description: 'Invoice currency (ISO 4217)', example: 'INR' })
  currencyCode: string;

  @ApiPropertyOptional({
    type: Number,
    description: "1 unit of the invoice currency in the legal entity's currency",
    nullable: true,
  })
  exchangeRate: number | null;

  @ApiProperty({ description: 'When the goods were received' })
  receivedDate: string;

  @ApiProperty({ description: 'Site location the lines are put at unless they name their own' })
  defaultLocationId: string;

  @ApiPropertyOptional({
    type: String,
    description: "Number on the supplier's delivery note (challan)",
    nullable: true,
  })
  supplierDeliveryNoteNumber: string | null;

  @ApiPropertyOptional({ type: String, description: 'Internal notes', nullable: true })
  notes: string | null;

  @ApiProperty({ type: [ReceiveWithInvoiceLineResponseDto], description: 'Invoiced lines' })
  lines: ReceiveWithInvoiceLineResponseDto[];

  @ApiProperty({
    type: [PurchaseReferenceResponseDto],
    description: 'Purchases the Receive with Invoice receives and invoices',
  })
  purchases: PurchaseReferenceResponseDto[];

  @ApiProperty({
    type: [ReceiveWithInvoiceGoodsReceiptResponseDto],
    description: 'The draft or posted goods receipts of the Receive with Invoice',
  })
  goodsReceipts: ReceiveWithInvoiceGoodsReceiptResponseDto[];

  @ApiProperty({
    type: [SupplierInvoiceHoldResponseDto],
    description: 'Holds computed when the Receive with Invoice was posted',
  })
  holds: SupplierInvoiceHoldResponseDto[];
}
