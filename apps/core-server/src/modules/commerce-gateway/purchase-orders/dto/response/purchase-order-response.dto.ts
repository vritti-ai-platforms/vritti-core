import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class PurchaseOrderResponseDto {
  @ApiProperty({ description: 'Purchase order ID' })
  id: string;

  @ApiProperty({ description: 'Supplier ID' })
  supplierId: string;

  @ApiPropertyOptional({ description: 'Supplier name', nullable: true })
  supplierName: string | null;

  @ApiPropertyOptional({ description: 'PO number', nullable: true })
  poNumber: string | null;

  @ApiProperty({ description: 'PO status', enum: ['DRAFT', 'SENT', 'PARTIALLY_RECEIVED', 'RECEIVED', 'CANCELLED'] })
  status: string;

  @ApiProperty({ description: 'Order date (ISO string)' })
  orderDate: string;

  @ApiPropertyOptional({ description: 'Expected delivery date', nullable: true })
  expectedDate: string | null;

  @ApiPropertyOptional({ description: 'Notes', nullable: true })
  notes: string | null;

  @ApiPropertyOptional({ description: 'Total amount', nullable: true })
  totalAmount: number | null;

  @ApiProperty({ description: 'ISO timestamp of creation' })
  createdAt: string;

  @ApiProperty({ description: 'ISO timestamp of last update' })
  updatedAt: string;
}
