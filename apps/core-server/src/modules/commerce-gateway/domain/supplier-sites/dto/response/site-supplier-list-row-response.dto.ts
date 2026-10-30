import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export const SITE_ENROLLMENT_STATUSES = ['ENROLLED', 'NOT_ENROLLED'] as const;
export type SiteEnrollmentStatus = (typeof SITE_ENROLLMENT_STATUSES)[number];

export class SiteSupplierListRowResponseDto {
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

  @ApiPropertyOptional({ description: 'Payment term new enrollments start from', nullable: true })
  defaultPaymentTermId: string | null;

  @ApiProperty({ description: 'Whether the supplier is enrolled at this site', enum: SITE_ENROLLMENT_STATUSES })
  enrollmentStatus: SiteEnrollmentStatus;

  @ApiPropertyOptional({ description: "This site's enrollment, when enrolled", nullable: true })
  enrollmentId: string | null;

  @ApiPropertyOptional({ description: 'Payment term this site buys on, when enrolled', nullable: true })
  paymentTermId: string | null;

  @ApiPropertyOptional({ description: 'Name of the payment term, when enrolled', nullable: true })
  paymentTermName: string | null;

  @ApiPropertyOptional({ description: 'ISO timestamp the enrollment was created', nullable: true })
  enrolledAt: string | null;
}
