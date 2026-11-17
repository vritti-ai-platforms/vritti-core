import {
  GOODS_RECEIPT_STATUSES,
  type GoodsReceiptStatus,
} from '@commerce/goods-receipts/dto/response/goods-receipt-response.dto';
import {
  INBOUND_DELIVERY_SOURCES,
  INBOUND_DELIVERY_STATUSES,
  type InboundDeliverySource,
  type InboundDeliveryStatus,
} from '@commerce/inbound-deliveries/dto/response/inbound-delivery-response.dto';
import {
  PURCHASE_ORDER_INVOICE_STATUSES,
  PURCHASE_ORDER_RECEIPT_STATUSES,
  PURCHASE_ORDER_STATUSES,
  type PurchaseOrderInvoiceStatus,
  type PurchaseOrderReceiptStatus,
  type PurchaseOrderStatus,
} from '@commerce/purchase-orders/dto/response/purchase-order-response.dto';
import {
  SUPPLIER_INVOICE_STATUSES,
  type SupplierInvoiceStatus,
} from '@commerce/supplier-invoices/dto/response/supplier-invoice-response.dto';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CurrencyAmountDto } from '@vritti/api-sdk/money';
import {
  PURCHASE_LEG_ACTIONS,
  PURCHASE_LEG_STATUSES,
  PURCHASE_LEG_STEPS,
  PURCHASE_TYPES,
  type PurchaseLegAction,
  type PurchaseLegStatus,
  type PurchaseLegStep,
  type PurchaseType,
} from '../../constants/purchase.constants';
import { PurchaseAllocationResponseDto } from './purchase-allocation-response.dto';

export class PurchaseLegRejectionResponseDto {
  @ApiProperty({ description: 'Why the leg was sent back to sourcing' })
  reason: string;

  @ApiPropertyOptional({ description: 'User who rejected it', type: String, nullable: true })
  actorId: string | null;

  @ApiPropertyOptional({ description: 'Name of the user who rejected it', type: String, nullable: true })
  actorName: string | null;

  @ApiProperty({ description: 'When it was rejected' })
  at: string;
}

export class PurchaseLegPurchaseOrderResponseDto {
  @ApiProperty({ description: 'Purchase order ID' })
  id: string;

  @ApiProperty({ description: 'PO number', example: 'PO-202611-0001' })
  poNumber: string;

  @ApiProperty({ description: 'PO status', enum: PURCHASE_ORDER_STATUSES })
  status: PurchaseOrderStatus;

  @ApiProperty({ description: 'How much of the order is received', enum: PURCHASE_ORDER_RECEIPT_STATUSES })
  receiptStatus: PurchaseOrderReceiptStatus;

  @ApiProperty({ description: 'How much of what was received is invoiced', enum: PURCHASE_ORDER_INVOICE_STATUSES })
  invoiceStatus: PurchaseOrderInvoiceStatus;

  @ApiProperty({ description: 'PO currency code (ISO 4217)', example: 'INR' })
  currencyCode: string;
}

export class PurchaseLegDeliveryResponseDto {
  @ApiProperty({ description: 'Inbound delivery ID' })
  id: string;

  @ApiProperty({ description: 'Delivery number', example: 'IBD-202611-0001' })
  deliveryNumber: string;

  @ApiProperty({ description: 'Delivery status', enum: INBOUND_DELIVERY_STATUSES })
  status: InboundDeliveryStatus;

  @ApiProperty({
    description:
      'ANNOUNCED by the create inbound delivery action, GOODS_RECEIPT by create goods receipt, SUPPLIER_INVOICE by a Receive with Invoice',
    enum: INBOUND_DELIVERY_SOURCES,
  })
  source: InboundDeliverySource;

  @ApiProperty({ description: 'Date the goods are expected (YYYY-MM-DD)' })
  expectedDeliveryDate: string;

  @ApiPropertyOptional({ description: 'Open draft goods receipt against the delivery', type: String, nullable: true })
  receiptDraftId: string | null;
}

export class PurchaseLegReceiptResponseDto {
  @ApiProperty({ description: 'Goods receipt ID' })
  id: string;

  @ApiProperty({ description: 'GR number', example: 'GR-202611-0001' })
  grNumber: string;

  @ApiProperty({ description: 'Receipt status', enum: GOODS_RECEIPT_STATUSES })
  status: GoodsReceiptStatus;

  @ApiProperty({ description: 'Date the goods were received' })
  receivedDate: string;
}

export class PurchaseLegInvoiceResponseDto {
  @ApiProperty({ description: 'Supplier invoice ID' })
  id: string;

  @ApiProperty({ description: "The supplier's invoice number" })
  invoiceNumber: string;

  @ApiProperty({ description: 'Invoice status', enum: SUPPLIER_INVOICE_STATUSES })
  status: SupplierInvoiceStatus;

  @ApiProperty({ description: 'Open holds that block payment' })
  openHoldCount: number;

  @ApiProperty({ description: 'Whether it is a Receive with Invoice, opened in the Receive with Invoice screen' })
  isReceiveWithInvoice: boolean;
}

export class PurchaseLegDocumentsResponseDto {
  @ApiProperty({ type: [PurchaseLegPurchaseOrderResponseDto], description: "The leg's purchase orders" })
  purchaseOrders: PurchaseLegPurchaseOrderResponseDto[];

  @ApiProperty({ type: [PurchaseLegDeliveryResponseDto], description: "The leg's inbound deliveries" })
  deliveries: PurchaseLegDeliveryResponseDto[];

  @ApiProperty({ type: [PurchaseLegReceiptResponseDto], description: "The leg's goods receipts" })
  receipts: PurchaseLegReceiptResponseDto[];

  @ApiProperty({
    type: [PurchaseLegInvoiceResponseDto],
    description: "Supplier invoices for the leg's purchase orders",
  })
  invoices: PurchaseLegInvoiceResponseDto[];
}

export class PurchaseLegProgressResponseDto {
  @ApiProperty({ description: "Quantity due from the supplier, in the items' primary units" })
  duePrimaryQty: number;

  @ApiProperty({ description: "Quantity ordered, in the items' primary units" })
  orderedPrimaryQty: number;

  @ApiProperty({ description: "Quantity received, in the items' primary units" })
  receivedPrimaryQty: number;

  @ApiProperty({ description: "Quantity invoiced, in the items' primary units" })
  invoicedPrimaryQty: number;
}

export class PurchaseLegBlockersResponseDto {
  @ApiPropertyOptional({ description: 'Why the supplier cannot be cancelled now', type: String, nullable: true })
  cancel: string | null;

  @ApiPropertyOptional({ description: 'Why the supplier cannot be closed now', type: String, nullable: true })
  close: string | null;

  @ApiPropertyOptional({
    description:
      'Why the supplier cannot be submitted or its orders placed: the site has blocked buying an item allocated to it',
    type: String,
    nullable: true,
  })
  order: string | null;
}

export class PurchaseLegResponseDto {
  @ApiProperty({ description: 'Leg ID' })
  id: string;

  @ApiProperty({ description: 'Supplier ID' })
  supplierId: string;

  @ApiProperty({ description: 'Supplier name' })
  supplierName: string;

  @ApiProperty({ description: "The supplier's enrollment at the purchase's site" })
  supplierEnrollmentId: string;

  @ApiProperty({ description: "Purchase type, from the supplier's enrollment", enum: PURCHASE_TYPES })
  type: PurchaseType;

  @ApiProperty({ description: 'Whether the leg needs approval when started' })
  approvalEnabled: boolean;

  @ApiProperty({
    type: () => CurrencyAmountDto,
    description: "Sourced total from which approval is needed, in the legal entity's currency; zero means every leg",
  })
  approvalThreshold: CurrencyAmountDto;

  @ApiProperty({ description: 'Whether receipts go through quality check' })
  qualityCheckEnabled: boolean;

  @ApiProperty({ description: 'Furthest step the leg reached', enum: PURCHASE_LEG_STEPS })
  step: PurchaseLegStep;

  @ApiProperty({ description: 'Leg status', enum: PURCHASE_LEG_STATUSES })
  status: PurchaseLegStatus;

  @ApiPropertyOptional({ description: 'Why the supplier was closed', type: String, nullable: true })
  closeReason: string | null;

  @ApiPropertyOptional({
    description: 'When the supplier stopped expecting goods; it closes once invoiced',
    type: String,
    nullable: true,
  })
  receivingClosedAt: string | null;

  @ApiPropertyOptional({ description: 'When the supplier was cancelled', type: String, nullable: true })
  cancelledAt: string | null;

  @ApiPropertyOptional({ description: 'Why the supplier was cancelled', type: String, nullable: true })
  cancelReason: string | null;

  @ApiPropertyOptional({ description: 'Last time the leg was started', type: String, nullable: true })
  submittedAt: string | null;

  @ApiProperty({ type: [String], description: "The enrollment's current approvers" })
  approverUserIds: string[];

  @ApiProperty({ type: [String], description: "Names of the enrollment's current approvers" })
  approverNames: string[];

  @ApiPropertyOptional({ description: 'User who approved the leg', type: String, nullable: true })
  approvedBy: string | null;

  @ApiPropertyOptional({ description: 'Name of the user who approved the leg', type: String, nullable: true })
  approvedByName: string | null;

  @ApiPropertyOptional({ description: 'When the leg was approved', type: String, nullable: true })
  approvedAt: string | null;

  @ApiProperty({
    type: () => CurrencyAmountDto,
    description: "Σ unit price × quantity in the allocations' currency, over the priced allocations",
  })
  sourcedTotal: CurrencyAmountDto;

  @ApiProperty({ description: 'Whether any allocation has no price yet, leaving the sourced total incomplete' })
  hasUnpricedAllocations: boolean;

  @ApiPropertyOptional({
    type: () => PurchaseLegRejectionResponseDto,
    description: 'The last rejection, while the leg is back in sourcing',
    nullable: true,
  })
  rejection: PurchaseLegRejectionResponseDto | null;

  @ApiProperty({ description: 'Number of allocated lines' })
  lineCount: number;

  @ApiProperty({
    type: [PurchaseAllocationResponseDto],
    description: "The leg's allocations; empty on a table row, where only the count comes",
  })
  allocations: PurchaseAllocationResponseDto[];

  @ApiProperty({
    type: () => PurchaseLegDocumentsResponseDto,
    description: 'Documents the leg created or is invoiced on',
  })
  documents: PurchaseLegDocumentsResponseDto;

  @ApiProperty({
    type: () => PurchaseLegProgressResponseDto,
    description: 'Ordered, received and invoiced against due',
  })
  progress: PurchaseLegProgressResponseDto;

  @ApiProperty({
    description: 'Actions the caller may take on the leg now',
    enum: PURCHASE_LEG_ACTIONS,
    isArray: true,
  })
  availableActions: PurchaseLegAction[];

  @ApiProperty({ type: () => PurchaseLegBlockersResponseDto, description: 'Why the leg cannot be cancelled or closed' })
  blockers: PurchaseLegBlockersResponseDto;
}
