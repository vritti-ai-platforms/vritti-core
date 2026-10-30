import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class SiteSupplierEnrollmentResponseDto {
  @ApiProperty({ description: 'Site enrollment ID' })
  id: string;

  @ApiProperty({ description: 'Enrolled supplier ID' })
  supplierId: string;

  @ApiProperty({ description: 'Site ID the enrollment belongs to' })
  siteId: string;

  @ApiProperty({ description: 'Payment term this site buys from the supplier on' })
  paymentTermId: string;

  @ApiPropertyOptional({ description: 'Name of the payment term', nullable: true })
  paymentTermName: string | null;

  @ApiPropertyOptional({ description: "Supplier's tax registration this site is billed under", nullable: true })
  partyTaxRegistrationId: string | null;

  @ApiPropertyOptional({ description: 'Party bank account pick for this site', nullable: true })
  partyBankAccountId: string | null;

  @ApiProperty({ description: 'ISO timestamp of creation' })
  createdAt: string;
}
