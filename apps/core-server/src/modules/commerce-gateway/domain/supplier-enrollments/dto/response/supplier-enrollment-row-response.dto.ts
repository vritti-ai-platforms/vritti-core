import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export const SupplierEnrollmentStatusValues = {
  ENROLLED: 'ENROLLED',
  NOT_ENROLLED: 'NOT_ENROLLED',
} as const;
export type SupplierEnrollmentStatus =
  (typeof SupplierEnrollmentStatusValues)[keyof typeof SupplierEnrollmentStatusValues];
export const SUPPLIER_ENROLLMENT_STATUSES = Object.values(SupplierEnrollmentStatusValues);

export class SupplierEnrollmentRowResponseDto {
  @ApiPropertyOptional({
    description: 'Enrollment ID; null when the supplier is not enrolled at the site',
    nullable: true,
  })
  id: string | null;

  @ApiProperty({ description: 'Supplier ID' })
  supplierId: string;

  @ApiProperty({ description: 'Unique supplier code', example: 'sup-001' })
  supplierCode: string;

  @ApiProperty({ description: 'The party this supplier represents' })
  partyId: string;

  @ApiProperty({ description: 'Display name of the linked party', example: 'Acme Foods Pvt Ltd' })
  partyName: string;

  @ApiProperty({ description: 'Type of the linked party' })
  partyType: string;

  @ApiProperty({ description: 'Site ID' })
  siteId: string;

  @ApiPropertyOptional({ description: 'Site name (gateway-enriched)', nullable: true })
  siteName: string | null;

  @ApiPropertyOptional({ description: 'Site code (gateway-enriched)', nullable: true })
  siteCode: string | null;

  @ApiProperty({ description: 'Whether the supplier is enrolled at the site', enum: SUPPLIER_ENROLLMENT_STATUSES })
  enrollmentStatus: SupplierEnrollmentStatus;

  @ApiPropertyOptional({
    description: "Active at the site: the enrollment's own flag AND the supplier's at LE; null when not enrolled",
    nullable: true,
  })
  isActive: boolean | null;

  @ApiProperty({ description: 'Whether the supplier itself is active (supplier-wide)' })
  isSupplierActive: boolean;

  @ApiProperty({ description: 'Whether purchasing is blocked for the supplier' })
  purchasingBlocked: boolean;

  @ApiProperty({ description: 'Whether payments are blocked for the supplier' })
  paymentBlocked: boolean;

  @ApiProperty({ description: 'Default supplier currency code (ISO 4217)', example: 'INR' })
  currencyCode: string;

  @ApiProperty({ description: 'Payment term new enrollments start from' })
  defaultPaymentTermId: string;

  @ApiPropertyOptional({ description: 'Payment term the site buys on, when enrolled', nullable: true })
  paymentTermId: string | null;

  @ApiPropertyOptional({ description: 'Name of the payment term, when enrolled', nullable: true })
  paymentTermName: string | null;

  @ApiPropertyOptional({ description: "Supplier's tax registration the site is billed under", nullable: true })
  partyTaxRegistrationId: string | null;

  @ApiPropertyOptional({ description: 'Registration number of the picked tax registration', nullable: true })
  registrationNumber: string | null;

  @ApiPropertyOptional({ description: 'Country of the picked tax registration', nullable: true })
  registrationCountryCode: string | null;

  @ApiPropertyOptional({
    description: 'Jurisdiction (state) of the picked tax registration; null when it is national',
    nullable: true,
  })
  registrationJurisdictionName: string | null;

  @ApiPropertyOptional({ description: 'Party bank account pick for the site', nullable: true })
  partyBankAccountId: string | null;

  @ApiPropertyOptional({ description: 'Account name of the picked bank account', nullable: true })
  bankAccountName: string | null;

  @ApiPropertyOptional({ description: 'Order contact (company-person relationship) for the site', nullable: true })
  orderRelationshipId: string | null;

  @ApiPropertyOptional({ description: 'Job title of the order contact', nullable: true })
  orderContactLabel: string | null;

  @ApiPropertyOptional({ description: 'Name of the order contact', nullable: true })
  orderContactName: string | null;

  @ApiPropertyOptional({ description: "The enrollment's ordering email communication", nullable: true })
  orderEmailCommunicationId: string | null;

  @ApiPropertyOptional({ description: 'The ordering email address', nullable: true })
  orderEmail: string | null;

  @ApiPropertyOptional({ description: "The enrollment's ordering phone communication", nullable: true })
  orderPhoneCommunicationId: string | null;

  @ApiPropertyOptional({ description: 'The ordering phone number', nullable: true })
  orderPhone: string | null;

  @ApiPropertyOptional({ description: 'ISO timestamp the enrollment was created', nullable: true })
  enrolledAt: string | null;
}
