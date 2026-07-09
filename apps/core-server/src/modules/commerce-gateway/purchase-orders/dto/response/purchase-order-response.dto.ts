import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CurrencyAmountDto } from '@vritti/api-sdk/money';

export class PurchaseOrderResponseDto {
  @ApiProperty({ description: 'Purchase order ID' })
  id: string;

  @ApiProperty({ description: 'Supplier ID' })
  supplierId: string;

  @ApiPropertyOptional({ description: 'Supplier name', nullable: true })
  supplierName: string | null;

  @ApiPropertyOptional({ description: 'PO number', nullable: true })
  poNumber: string | null;

  @ApiProperty({
    description: 'PO status',
    enum: ['DRAFT', 'SENT', 'CONFIRMED', 'PARTIALLY_RECEIVED', 'RECEIVED', 'CANCELLED'],
  })
  status: string;

  @ApiProperty({ description: 'PO currency code (ISO 4217) — snapshot from supplier', example: 'USD' })
  currencyCode: string;

  @ApiPropertyOptional({
    description: 'Exchange rate from supplier currency to BU currency. Null when type is VARIABLE.',
    nullable: true,
    example: 83.5,
  })
  exchangeRate: number | null;

  @ApiProperty({
    description: 'Exchange rate policy. FIXED locks the rate at PO time; VARIABLE defers to GR/invoice.',
    enum: ['FIXED', 'VARIABLE'],
  })
  exchangeRateType: 'FIXED' | 'VARIABLE';

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

  @ApiProperty({ description: 'True when any goods receipt exists against this PO; edits are locked' })
  goodsReceiptExists: boolean;

  @ApiProperty({ description: 'ISO timestamp of creation' })
  createdAt: string;

  @ApiProperty({ description: 'ISO timestamp of last update' })
  updatedAt: string;
}
