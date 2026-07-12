import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class SupplierResponseDto {
  @ApiProperty({ description: 'Supplier ID' })
  id: string;

  @ApiProperty({ description: 'Supplier name', example: 'Acme Foods Pvt Ltd' })
  name: string;

  @ApiProperty({ description: 'Unique supplier code', example: 'SUP-001' })
  code: string;

  @ApiProperty({ description: 'Default supplier currency code (ISO 4217)', example: 'INR' })
  currencyCode: string;

  @ApiPropertyOptional({ description: 'Primary contact person name', nullable: true })
  contactName: string | null;

  @ApiProperty({ description: 'Phone number' })
  phone: string;

  @ApiPropertyOptional({ description: 'Email address', nullable: true })
  email: string | null;

  @ApiPropertyOptional({ description: 'Supplier website URL', nullable: true })
  website: string | null;

  @ApiPropertyOptional({ description: 'Mailing address', nullable: true })
  address: string | null;

  @ApiPropertyOptional({ description: 'Supplier tax ID', nullable: true })
  taxId: string | null;

  @ApiPropertyOptional({
    description: 'Tax ID type',
    nullable: true,
    enum: ['GST', 'VAT', 'EIN', 'SALES_TAX', 'OTHER'],
  })
  taxIdType: string | null;

  @ApiPropertyOptional({ description: 'Payment terms', nullable: true })
  paymentTerms: string | null;

  @ApiPropertyOptional({ description: 'Default lead time in days', nullable: true })
  leadTimeDays: number | null;

  @ApiPropertyOptional({ description: 'Additional notes', nullable: true })
  notes: string | null;

  @ApiProperty({ description: 'Whether the supplier is active' })
  isActive: boolean;

  @ApiProperty({ description: 'ISO timestamp of creation' })
  createdAt: string;

  @ApiProperty({ description: 'ISO timestamp of last update' })
  updatedAt: string;
}
