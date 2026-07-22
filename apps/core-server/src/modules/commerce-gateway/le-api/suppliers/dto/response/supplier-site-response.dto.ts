import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class SupplierSiteResponseDto {
  @ApiProperty({ description: 'Supplier site enrollment ID' })
  id: string;

  @ApiProperty({ description: 'Supplier ID' })
  supplierId: string;

  @ApiProperty({ description: 'Enrolled site ID' })
  siteId: string;

  @ApiPropertyOptional({ description: 'Site name (gateway-enriched, not sortable)', nullable: true })
  siteName: string | null;

  @ApiPropertyOptional({ description: 'Site code (gateway-enriched, not sortable)', nullable: true })
  siteCode: string | null;

  @ApiPropertyOptional({ description: 'Party tax registration pick for this site', nullable: true })
  partyTaxRegistrationId: string | null;

  @ApiPropertyOptional({ description: 'Registration number of the picked tax registration', nullable: true })
  registrationNumber: string | null;

  @ApiPropertyOptional({ description: 'Party bank account pick for this site', nullable: true })
  partyBankAccountId: string | null;

  @ApiPropertyOptional({ description: 'Account name of the picked bank account', nullable: true })
  bankAccountName: string | null;

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

  @ApiProperty({ description: 'Whether the site enrollment is active' })
  isActive: boolean;

  @ApiProperty({ description: 'ISO timestamp of creation' })
  createdAt: string;
}
