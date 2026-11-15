import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class SupplierEnrollmentResponseDto {
  @ApiProperty({ description: 'Enrollment ID' })
  id: string;

  @ApiProperty({ description: 'Enrolled supplier ID' })
  supplierId: string;

  @ApiProperty({ description: 'Site ID the enrollment belongs to' })
  siteId: string;

  @ApiProperty({ description: 'Payment term this site buys from the supplier on' })
  paymentTermId: string;

  @ApiProperty({ description: 'Name of the payment term' })
  paymentTermName: string;

  @ApiPropertyOptional({ description: "Supplier's tax registration this site is invoiced under", nullable: true })
  partyTaxRegistrationId: string | null;

  @ApiPropertyOptional({ description: 'Party bank account pick for this site', nullable: true })
  partyBankAccountId: string | null;

  @ApiPropertyOptional({ description: 'Registration number of the picked tax registration', nullable: true })
  registrationNumber: string | null;

  @ApiPropertyOptional({ description: 'Type of the picked tax registration', nullable: true })
  registrationType: string | null;

  @ApiPropertyOptional({ description: 'Country of the picked tax registration', nullable: true })
  registrationCountryCode: string | null;

  @ApiPropertyOptional({
    description: 'Jurisdiction (state) of the picked tax registration; null when it is national',
    nullable: true,
  })
  registrationJurisdictionName: string | null;

  @ApiPropertyOptional({ description: 'Account name of the picked bank account', nullable: true })
  bankAccountName: string | null;

  @ApiPropertyOptional({ description: 'Bank of the picked bank account', nullable: true })
  bankName: string | null;

  @ApiPropertyOptional({ description: 'Company-person relationship pick for the order contact', nullable: true })
  orderRelationshipId: string | null;

  @ApiPropertyOptional({ description: 'Label of the picked order-contact relationship', nullable: true })
  orderContactLabel: string | null;

  @ApiPropertyOptional({ description: 'Name of the order-contact person', nullable: true })
  orderContactName: string | null;

  @ApiPropertyOptional({ description: 'Email of the order-contact person', nullable: true })
  orderContactEmail: string | null;

  @ApiPropertyOptional({ description: 'Phone of the order-contact person', nullable: true })
  orderContactPhone: string | null;

  @ApiProperty({ description: "The enrollment's ordering email communication" })
  orderEmailCommunicationId: string;

  @ApiProperty({ description: "The enrollment's ordering phone communication" })
  orderPhoneCommunicationId: string;

  @ApiProperty({ description: 'The ordering email address' })
  orderEmail: string;

  @ApiProperty({ description: 'The ordering phone number' })
  orderPhone: string;

  @ApiProperty({ description: "Active at the site: the enrollment's own flag AND the supplier's at LE" })
  isActive: boolean;

  @ApiProperty({ description: 'Whether the supplier itself is active (supplier-wide)' })
  isSupplierActive: boolean;

  @ApiProperty({ description: 'ISO timestamp of creation' })
  createdAt: string;

  @ApiProperty({ description: 'ISO timestamp of the last update' })
  updatedAt: string;
}
