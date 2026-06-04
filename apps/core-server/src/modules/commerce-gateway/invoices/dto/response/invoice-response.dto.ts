import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class InvoiceItemResponseDto {
  @ApiProperty({ description: 'Line item ID' })
  id: string;

  @ApiProperty({ description: 'Line item description' })
  description: string;

  @ApiProperty({ description: 'Quantity' })
  quantity: number;

  @ApiProperty({ description: 'Unit price in minor units (bigint serialized as string)' })
  unitPrice: string;

  @ApiProperty({ description: 'Tax amount for this item in minor units (bigint serialized as string)' })
  taxAmount: string;

  @ApiProperty({ description: 'Line total in minor units (bigint serialized as string)' })
  total: string;

  @ApiPropertyOptional({ description: 'Reference item ID', nullable: true })
  referenceItemId: string | null;
}

export class InvoiceResponseDto {
  @ApiProperty({ description: 'Invoice ID' })
  id: string;

  @ApiProperty({ description: 'Invoice type', enum: ['PAYABLE', 'RECEIVABLE'] })
  type: string;

  @ApiProperty({ description: 'Invoice number' })
  invoiceNumber: string;

  @ApiProperty({ description: 'Party type', enum: ['SUPPLIER', 'CUSTOMER', 'AGGREGATOR'] })
  partyType: string;

  @ApiPropertyOptional({ description: 'Party entity ID', nullable: true })
  partyId: string | null;

  @ApiProperty({ description: 'Party display name' })
  partyName: string;

  @ApiPropertyOptional({ description: 'Source reference type', nullable: true })
  referenceType: string | null;

  @ApiPropertyOptional({ description: 'Source reference ID', nullable: true })
  referenceId: string | null;

  @ApiProperty({ description: 'Subtotal before tax and discount, in minor units (bigint serialized as string)' })
  subtotal: string;

  @ApiProperty({ description: 'Total tax amount in minor units (bigint serialized as string)' })
  taxAmount: string;

  @ApiProperty({ description: 'Total discount amount in minor units (bigint serialized as string)' })
  discountAmount: string;

  @ApiProperty({ description: 'Total amount in minor units (bigint serialized as string)' })
  totalAmount: string;

  @ApiProperty({ description: 'Amount paid so far, in minor units (bigint serialized as string)' })
  paidAmount: string;

  @ApiProperty({ description: 'Remaining balance in minor units (bigint serialized as string)' })
  balance: string;

  @ApiProperty({ description: 'Invoice status', enum: ['DRAFT', 'ISSUED', 'PARTIALLY_PAID', 'PAID', 'OVERDUE', 'VOID'] })
  status: string;

  @ApiPropertyOptional({ description: 'Payment terms', nullable: true })
  paymentTerms: string | null;

  @ApiPropertyOptional({ description: 'Issue date', nullable: true })
  issuedDate: string | null;

  @ApiPropertyOptional({ description: 'Due date', nullable: true })
  dueDate: string | null;

  @ApiPropertyOptional({ description: 'Notes', nullable: true })
  notes: string | null;

  @ApiProperty({ description: 'ISO timestamp of creation' })
  createdAt: string;

  @ApiProperty({ description: 'ISO timestamp of last update' })
  updatedAt: string;
}

export class InvoiceDetailResponseDto extends InvoiceResponseDto {
  @ApiProperty({ type: [InvoiceItemResponseDto], description: 'Invoice line items' })
  items: InvoiceItemResponseDto[];
}
