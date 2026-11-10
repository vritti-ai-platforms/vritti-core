import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class InboundDeliveryResponseDto {
  @ApiProperty({ description: 'Inbound delivery ID' })
  id: string;

  @ApiProperty({ description: 'Delivery number', example: 'IBD-202611-0001' })
  deliveryNumber: string;

  @ApiProperty({ description: 'Legal entity the delivery belongs to' })
  legalEntityId: string;

  @ApiProperty({ description: 'Site the goods arrive at' })
  siteId: string;

  @ApiProperty({ description: 'Supplier delivering the goods' })
  supplierId: string;

  @ApiProperty({ description: 'Supplier name' })
  supplierName: string;

  @ApiProperty({
    description: 'Delivery status',
    enum: ['PLANNED', 'IN_TRANSIT', 'ARRIVED', 'PARTIALLY_RECEIVED', 'RECEIVED', 'CANCELLED'],
  })
  status: string;

  @ApiProperty({
    description: 'ANNOUNCED when created ahead of arrival, RECEIPT when a goods receipt without a delivery created it',
    enum: ['ANNOUNCED', 'RECEIPT'],
  })
  source: string;

  @ApiProperty({ description: 'Date the goods are expected (YYYY-MM-DD); its PO lines follow it' })
  expectedDeliveryDate: string;

  @ApiPropertyOptional({ description: 'Carrier', nullable: true })
  carrier: string | null;

  @ApiPropertyOptional({ description: 'Tracking number', nullable: true })
  trackingNumber: string | null;

  @ApiPropertyOptional({ description: "Number on the supplier's delivery note (challan)", nullable: true })
  supplierDeliveryNoteNumber: string | null;

  @ApiPropertyOptional({ description: "Date on the supplier's delivery note (YYYY-MM-DD)", nullable: true })
  supplierDeliveryNoteDate: string | null;

  @ApiPropertyOptional({ description: 'Notes', nullable: true })
  notes: string | null;

  @ApiProperty({ description: 'Number of PO lines on the delivery' })
  lineCount: number;

  @ApiProperty({
    type: [String],
    description: 'Numbers of the purchase orders whose lines the delivery carries, sorted',
  })
  poNumbers: string[];

  @ApiProperty({ description: 'Goods receipts (draft or published) recorded against the delivery' })
  goodsReceiptCount: number;

  @ApiPropertyOptional({ description: 'Open draft goods receipt against the delivery', nullable: true })
  draftGoodsReceiptId: string | null;

  @ApiPropertyOptional({ description: 'Goods receipt that created a RECEIPT-source delivery', nullable: true })
  sourceGoodsReceiptId: string | null;

  @ApiPropertyOptional({
    description: 'GR number of the goods receipt that created a RECEIPT-source delivery',
    nullable: true,
  })
  sourceGrNumber: string | null;

  @ApiProperty({
    description:
      'False once the delivery is RECEIVED or CANCELLED, or when a goods receipt created it — its date, details and lines lock',
  })
  isEditable: boolean;

  @ApiProperty({ description: 'True while it is PLANNED, IN_TRANSIT or ARRIVED and no goods receipt names it' })
  canCancel: boolean;

  @ApiProperty({ description: 'True while it is PLANNED, without lines and without goods receipts' })
  canDelete: boolean;

  @ApiProperty({
    description: 'True while an announced delivery is open and a line still has quantity to receive against it',
  })
  canReceive: boolean;

  @ApiProperty({ description: 'ISO timestamp of creation' })
  createdAt: string;

  @ApiProperty({ description: 'ISO timestamp of the last change' })
  updatedAt: string;
}
