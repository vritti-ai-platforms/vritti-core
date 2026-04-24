import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CurrencyAmountDto } from '@vritti/api-sdk';

export class PurchaseOrderResponseDto {
  @ApiProperty({ description: 'Purchase order ID' })
  id: string;

  @ApiProperty({ description: 'Supplier ID' })
  supplierId: string;

  @ApiPropertyOptional({ description: 'Supplier name', nullable: true })
  supplierName: string | null;

  @ApiPropertyOptional({ description: 'Supplier currency code (ISO 4217)', nullable: true, example: 'INR' })
  supplierCurrencyCode: string | null;

  @ApiPropertyOptional({ description: 'PO number', nullable: true })
  poNumber: string | null;

  @ApiProperty({
    description: 'PO status',
    enum: ['DRAFT', 'SENT', 'CONFIRMED', 'PARTIALLY_RECEIVED', 'RECEIVED', 'CANCELLED'],
  })
  status: string;

  @ApiProperty({ description: 'PO currency code (ISO 4217)', example: 'INR' })
  currencyCode: string;

  @ApiProperty({ description: 'FX conversion rate from supplier currency to PO currency', example: 1 })
  conversionRate: number;

  @ApiProperty({ description: 'Order date (ISO string)' })
  orderDate: string;

  @ApiPropertyOptional({ description: 'Expected-by date/time', nullable: true })
  expectedBy: string | null;

  @ApiProperty({ description: 'IANA timezone the PO was raised under (origin BU zone)', example: 'Asia/Kolkata' })
  timezone: string;

  @ApiPropertyOptional({ description: 'Notes', nullable: true })
  notes: string | null;

  @ApiPropertyOptional({ type: CurrencyAmountDto, nullable: true })
  totalAmount: CurrencyAmountDto | null;

  @ApiProperty({ description: 'ISO timestamp of creation' })
  createdAt: string;

  @ApiProperty({ description: 'ISO timestamp of last update' })
  updatedAt: string;
}
