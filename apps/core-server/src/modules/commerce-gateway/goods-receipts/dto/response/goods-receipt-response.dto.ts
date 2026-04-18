import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class GoodsReceiptItemResponseDto {
  @ApiProperty()
  id: string;

  @ApiPropertyOptional({ nullable: true })
  purchaseOrderItemId: string | null;

  @ApiProperty()
  inventoryItemId: string;

  @ApiPropertyOptional({ nullable: true })
  inventoryItemName: string | null;

  @ApiProperty()
  acceptedQuantity: number;

  @ApiProperty()
  rejectedQuantity: number;

  @ApiPropertyOptional({ nullable: true })
  rejectionReason: string | null;

  @ApiPropertyOptional({ nullable: true })
  batchNumber: string | null;

  @ApiPropertyOptional({ nullable: true })
  manufacturingDate: string | null;

  @ApiPropertyOptional({ nullable: true })
  expiryDate: string | null;
}

export class GoodsReceiptResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  grNumber: string;

  @ApiProperty()
  supplierId: string;

  @ApiProperty({ description: 'Goods receipt status' })
  status: string;

  @ApiPropertyOptional({ nullable: true })
  supplierName: string | null;

  @ApiPropertyOptional({ nullable: true })
  purchaseOrderId: string | null;

  @ApiPropertyOptional({ nullable: true })
  poNumber: string | null;

  @ApiPropertyOptional({ nullable: true })
  receivedBy: string | null;

  @ApiProperty()
  receivedDate: string;

  @ApiPropertyOptional({ nullable: true })
  notes: string | null;

  @ApiProperty()
  createdAt: string;

  @ApiProperty({ type: [GoodsReceiptItemResponseDto] })
  items: GoodsReceiptItemResponseDto[];
}
