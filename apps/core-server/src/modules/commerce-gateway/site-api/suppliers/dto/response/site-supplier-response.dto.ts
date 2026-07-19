import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class SiteSupplierResponseDto {
  @ApiProperty({ description: 'Supplier ID' })
  id: string;

  @ApiProperty({ description: 'The party this supplier represents' })
  partyId: string;

  @ApiProperty({ description: 'Display name of the linked party', example: 'Acme Foods Pvt Ltd' })
  partyName: string;

  @ApiProperty({ description: 'Unique supplier code', example: 'sup-001' })
  code: string;

  @ApiProperty({ description: 'Default supplier currency code (ISO 4217)', example: 'INR' })
  currencyCode: string;

  @ApiPropertyOptional({ description: 'Payment terms', nullable: true })
  paymentTerms: string | null;

  @ApiPropertyOptional({ description: 'Default lead time in days', nullable: true })
  leadTimeDays: number | null;

  @ApiProperty({ description: 'Whether purchasing from this supplier is blocked' })
  purchasingBlocked: boolean;

  @ApiProperty({ description: 'Whether payments to this supplier are blocked' })
  paymentBlocked: boolean;

  @ApiPropertyOptional({ description: 'Email for purchase orders', nullable: true })
  orderEmail: string | null;

  @ApiPropertyOptional({ description: 'Phone for purchase orders', nullable: true })
  orderPhone: string | null;

  @ApiProperty({ description: 'Whether the supplier is active' })
  isActive: boolean;

  @ApiProperty({ description: 'Site enrollment ID' })
  enrollmentId: string;

  @ApiPropertyOptional({ description: 'Party tax registration pick for this site', nullable: true })
  partyTaxRegistrationId: string | null;

  @ApiPropertyOptional({ description: 'Registration number of the picked tax registration', nullable: true })
  registrationNumber: string | null;

  @ApiPropertyOptional({ description: 'Party bank account pick for this site', nullable: true })
  partyBankAccountId: string | null;

  @ApiPropertyOptional({ description: 'Account name of the picked bank account', nullable: true })
  bankAccountName: string | null;

  @ApiProperty({ description: 'Whether the site enrollment is active' })
  enrollmentActive: boolean;

  @ApiProperty({ description: 'ISO timestamp the enrollment was created' })
  enrolledAt: string;
}
