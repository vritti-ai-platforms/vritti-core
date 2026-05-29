import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class GoodsReceiptPoDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  poNumber: string;

  @ApiProperty()
  orderDate: string;

  @ApiPropertyOptional({ nullable: true })
  expectedBy: string | null;

  @ApiProperty()
  totalAmount: { currency: string; value: number };
}

export class GoodsReceiptResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  grNumber: string;

  @ApiProperty()
  supplierId: string;

  @ApiProperty()
  supplierName: string;

  @ApiProperty()
  status: string;

  @ApiPropertyOptional()
  isPublishable?: boolean;

  @ApiPropertyOptional({ description: 'True when the GR is DRAFT, has no PO yet, and has no items.' })
  canLinkPurchaseOrder?: boolean;

  @ApiPropertyOptional({ description: 'True when the GR is DRAFT, has a PO linked, and has no items.' })
  canUnlinkPurchaseOrder?: boolean;

  @ApiPropertyOptional({ type: GoodsReceiptPoDto, nullable: true })
  po: GoodsReceiptPoDto | null;

  @ApiPropertyOptional({ nullable: true })
  receivedBy: string | null;

  @ApiProperty()
  receivedDate: string;

  @ApiPropertyOptional({ nullable: true })
  notes: string | null;

  @ApiProperty({
    description: 'Supplier→BU exchange rate locked at GR creation. 1 when currencies match.',
  })
  exchangeRate: number;

  @ApiPropertyOptional({ nullable: true })
  publishedAt: string | null;

  @ApiProperty()
  createdAt: string;
}
