import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

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

  @ApiProperty({ description: 'Receipt status', enum: ['DRAFT', 'PUBLISHED'] })
  status: string;

  @ApiProperty({
    description: 'True for a draft whose every item is fully distributed to balanced lines — the Publish gate',
  })
  isPublishable: boolean;

  @ApiProperty({ description: 'Number of items counted on the receipt' })
  itemCount: number;

  @ApiProperty({ description: 'Inbound delivery the goods arrived on' })
  inboundDeliveryId: string;

  @ApiProperty({ description: 'Number of the inbound delivery', example: 'IBD-202611-0001' })
  deliveryNumber: string;

  @ApiProperty({
    description: 'ANNOUNCED when received against a delivery announced ahead, RECEIPT when the receipt created it',
    enum: ['ANNOUNCED', 'RECEIPT'],
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

  @ApiPropertyOptional({ description: 'ISO timestamp of publishing', nullable: true })
  publishedAt: string | null;

  @ApiProperty({ description: 'ISO timestamp of creation' })
  createdAt: string;
}
