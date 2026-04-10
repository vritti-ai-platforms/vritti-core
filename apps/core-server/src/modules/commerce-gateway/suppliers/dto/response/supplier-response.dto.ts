import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class SupplierResponseDto {
  @ApiProperty({ description: 'Supplier ID' })
  id: string;

  @ApiProperty({ description: 'Supplier name', example: 'Acme Foods Pvt Ltd' })
  name: string;

  @ApiProperty({ description: 'Unique supplier code', example: 'SUP-001' })
  code: string;

  @ApiPropertyOptional({ description: 'Primary contact person name', nullable: true })
  contactName: string | null;

  @ApiPropertyOptional({ description: 'Phone number', nullable: true })
  phone: string | null;

  @ApiPropertyOptional({ description: 'Email address', nullable: true })
  email: string | null;

  @ApiPropertyOptional({ description: 'Mailing address', nullable: true })
  address: string | null;

  @ApiPropertyOptional({ description: 'GST identification number', nullable: true })
  gstin: string | null;

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
