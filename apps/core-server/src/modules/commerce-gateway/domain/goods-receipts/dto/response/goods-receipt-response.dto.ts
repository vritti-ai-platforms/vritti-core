import { INBOUND_DELIVERY_SOURCES } from '@commerce/inbound-deliveries/dto/response/inbound-delivery-response.dto';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export const GOODS_RECEIPT_STATUSES = ['DRAFT', 'POSTED'] as const;
export type GoodsReceiptStatus = (typeof GOODS_RECEIPT_STATUSES)[number];

export class GoodsReceiptResponseDto {
  @ApiProperty({ description: 'Goods receipt ID' })
  id: string;

  @ApiProperty({ description: 'GR number', example: 'GR-202611-0001' })
  grNumber: string;

  @ApiProperty({ description: 'Legal entity the receipt belongs to' })
  legalEntityId: string;

  @ApiProperty({ description: 'Site the goods were received at — the site of every purchase order on it' })
  siteId: string;

  @ApiProperty({ description: 'Supplier the goods arrived from' })
  supplierId: string;

  @ApiProperty({ description: 'Supplier name' })
  supplierName: string;

  @ApiPropertyOptional({ description: 'Purchase that created the receipt', type: String, nullable: true })
  purchaseId: string | null;

  @ApiPropertyOptional({ description: 'Number of that purchase', type: String, nullable: true })
  purchaseNumber: string | null;

  @ApiPropertyOptional({
    description:
      'Supplier invoice of the Receive with Invoice the receipt belongs to; it is edited only through that invoice',
    type: String,
    nullable: true,
  })
  receiveWithInvoiceInvoiceId: string | null;

  @ApiProperty({ description: 'Receipt status', enum: GOODS_RECEIPT_STATUSES })
  status: string;

  @ApiProperty({
    description: 'True for a draft whose every item is fully distributed to balanced lines — the Post gate',
  })
  isPostable: boolean;

  @ApiProperty({ description: 'Number of items counted on the receipt' })
  itemCount: number;

  @ApiProperty({ description: 'Inbound delivery the goods arrived on' })
  inboundDeliveryId: string;

  @ApiProperty({ description: 'Number of the inbound delivery', example: 'IBD-202611-0001' })
  deliveryNumber: string;

  @ApiProperty({
    description:
      'Source of the delivery received: ANNOUNCED for every manual receipt; GOODS_RECEIPT or SUPPLIER_INVOICE when a Purchase created it',
    enum: INBOUND_DELIVERY_SOURCES,
  })
  deliverySource: string;

  @ApiPropertyOptional({ description: 'Carrier of the inbound delivery', nullable: true })
  carrier: string | null;

  @ApiPropertyOptional({ description: 'Tracking number of the inbound delivery', nullable: true })
  trackingNumber: string | null;

  @ApiPropertyOptional({
    description: "Number on the supplier's delivery note (challan), from the inbound delivery",
    nullable: true,
  })
  supplierDeliveryNoteNumber: string | null;

  @ApiPropertyOptional({
    description: "Date on the supplier's delivery note (YYYY-MM-DD), from the inbound delivery",
    nullable: true,
  })
  supplierDeliveryNoteDate: string | null;

  @ApiProperty({ type: [String], description: 'Numbers of the purchase orders whose lines the receipt counts, sorted' })
  poNumbers: string[];

  @ApiPropertyOptional({
    description: "Latest expected delivery date (YYYY-MM-DD) of the receipt's purchase order lines",
    nullable: true,
  })
  expectedDeliveryDate: string | null;

  @ApiProperty({ description: 'Date the goods were received' })
  receivedDate: string;

  @ApiPropertyOptional({ description: 'Notes', nullable: true })
  notes: string | null;

  @ApiPropertyOptional({ description: 'ISO timestamp of posting', nullable: true })
  postedAt: string | null;

  @ApiProperty({ description: 'ISO timestamp of creation' })
  createdAt: string;
}
