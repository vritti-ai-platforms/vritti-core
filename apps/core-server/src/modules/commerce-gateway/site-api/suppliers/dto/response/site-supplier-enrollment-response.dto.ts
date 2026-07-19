import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class SiteSupplierEnrollmentResponseDto {
  @ApiProperty({ description: 'Site enrollment ID' })
  id: string;

  @ApiProperty({ description: 'Enrolled supplier ID' })
  supplierId: string;

  @ApiProperty({ description: 'Site ID the enrollment belongs to' })
  siteId: string;

  @ApiPropertyOptional({ description: 'Party tax registration pick for this site', nullable: true })
  partyTaxRegistrationId: string | null;

  @ApiPropertyOptional({ description: 'Party bank account pick for this site', nullable: true })
  partyBankAccountId: string | null;

  @ApiProperty({ description: 'Whether the enrollment is active' })
  isActive: boolean;

  @ApiProperty({ description: 'ISO timestamp of creation' })
  createdAt: string;
}
