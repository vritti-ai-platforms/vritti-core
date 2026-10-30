import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { SITE_ENROLLMENT_STATUSES, type SiteEnrollmentStatus } from './site-supplier-list-row-response.dto';

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

  @ApiPropertyOptional({ description: 'Payment term new enrollments start from', nullable: true })
  defaultPaymentTermId: string | null;

  @ApiProperty({ description: 'Whether the supplier is enrolled at the site', enum: SITE_ENROLLMENT_STATUSES })
  enrollmentStatus: SiteEnrollmentStatus;

  @ApiPropertyOptional({ description: "The site's enrollment of the supplier, when enrolled", nullable: true })
  enrollmentId: string | null;

  @ApiPropertyOptional({ description: 'Payment term the site buys on, when enrolled', nullable: true })
  paymentTermId: string | null;

  @ApiPropertyOptional({ description: 'Name of the payment term, when enrolled', nullable: true })
  paymentTermName: string | null;

  @ApiPropertyOptional({
    description: "Supplier's tax registration the site is billed under, when enrolled",
    nullable: true,
  })
  partyTaxRegistrationId: string | null;

  @ApiPropertyOptional({ description: 'Registration number of the picked tax registration', nullable: true })
  registrationNumber: string | null;

  @ApiPropertyOptional({ description: 'Party bank account pick for this site', nullable: true })
  partyBankAccountId: string | null;

  @ApiPropertyOptional({ description: 'Account name of the picked bank account', nullable: true })
  bankAccountName: string | null;

  @ApiPropertyOptional({ description: 'Order contact (company-person relationship) for this site', nullable: true })
  orderRelationshipId: string | null;

  @ApiPropertyOptional({ description: 'ISO timestamp the enrollment was created, when enrolled', nullable: true })
  enrolledAt: string | null;
}
