import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class SupplierResponseDto {
  @ApiProperty({ description: 'Supplier ID' })
  id: string;

  @ApiProperty({ description: 'The party this supplier represents' })
  partyId: string;

  @ApiProperty({ description: 'Display name of the linked party', example: 'Acme Foods Pvt Ltd' })
  partyName: string;

  @ApiPropertyOptional({ description: 'Type of the linked party (COMPANY or PERSON)', nullable: true })
  partyType?: string | null;

  @ApiProperty({ description: 'Unique supplier code', example: 'SUP-001' })
  code: string;

  @ApiProperty({ description: 'Default supplier currency code (ISO 4217)', example: 'INR' })
  currencyCode: string;

  @ApiProperty({
    type: [String],
    description: 'Every currency the supplier trades in, the default included',
    example: ['INR', 'USD'],
  })
  currencyCodes: string[];

  @ApiPropertyOptional({ description: 'Payment term new site enrollments start from', nullable: true })
  defaultPaymentTermId: string | null;

  @ApiPropertyOptional({ description: 'Name of the default payment term', nullable: true })
  defaultPaymentTermName?: string | null;

  @ApiPropertyOptional({ description: 'Additional notes', nullable: true })
  notes: string | null;

  @ApiProperty({ description: 'Whether the supplier is active' })
  isActive: boolean;

  @ApiProperty({ description: 'ISO timestamp of creation' })
  createdAt: string;

  @ApiProperty({ description: 'ISO timestamp of last update' })
  updatedAt: string;
}
