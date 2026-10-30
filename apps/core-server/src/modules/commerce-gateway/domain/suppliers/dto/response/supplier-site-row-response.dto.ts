import {
  SITE_ENROLLMENT_STATUSES,
  type SiteEnrollmentStatus,
} from '@commerce/supplier-sites/dto/response/site-supplier-list-row-response.dto';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

// One of the legal entity's sites with the supplier's enrollment there, when it has one
export class SupplierSiteRowResponseDto {
  @ApiPropertyOptional({ description: 'Enrollment ID, when the supplier is enrolled at the site', nullable: true })
  id: string | null;

  @ApiProperty({ description: 'Supplier ID' })
  supplierId: string;

  @ApiProperty({ description: 'Site ID' })
  siteId: string;

  @ApiPropertyOptional({ description: 'Site name', nullable: true })
  siteName: string | null;

  @ApiPropertyOptional({ description: 'Site code', nullable: true })
  siteCode: string | null;

  @ApiProperty({ description: 'Whether the supplier is enrolled at the site', enum: SITE_ENROLLMENT_STATUSES })
  enrollmentStatus: SiteEnrollmentStatus;

  @ApiPropertyOptional({ description: 'Payment term the site buys on', nullable: true })
  paymentTermId: string | null;

  @ApiPropertyOptional({ description: 'Name of the payment term', nullable: true })
  paymentTermName: string | null;

  @ApiPropertyOptional({ description: "Supplier's tax registration the site is billed under", nullable: true })
  partyTaxRegistrationId: string | null;

  @ApiPropertyOptional({ description: 'Registration number of the picked tax registration', nullable: true })
  registrationNumber: string | null;

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

  @ApiPropertyOptional({ description: 'ISO timestamp the enrollment was created', nullable: true })
  createdAt: string | null;
}
