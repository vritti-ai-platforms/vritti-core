import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsUUID } from 'class-validator';

export class CreateSupplierEnrollmentDto {
  @ApiPropertyOptional({
    description: 'Supplier to enroll; required on the site route, taken from the path on the legal entity route',
  })
  @IsOptional()
  @IsUUID('7')
  supplierId?: string;

  @ApiPropertyOptional({
    description:
      'Site to enroll the supplier at; required on the legal entity route, taken from the session on the site route',
  })
  @IsOptional()
  @IsUUID('7')
  siteId?: string;

  @ApiProperty({ description: 'Payment term this site buys from the supplier on' })
  @IsUUID('7')
  paymentTermId: string;

  @ApiPropertyOptional({
    description: "Supplier's GSTIN or VAT registration this site is invoiced under; omit for an unregistered supplier",
    nullable: true,
  })
  @IsOptional()
  @IsUUID('7')
  partyTaxRegistrationId?: string | null;

  @ApiPropertyOptional({ description: 'Party bank account pick for payments from this site', nullable: true })
  @IsOptional()
  @IsUUID('7')
  partyBankAccountId?: string | null;

  @ApiPropertyOptional({
    description: 'Company-person relationship pick for the order contact at this site',
    nullable: true,
  })
  @IsOptional()
  @IsUUID('7')
  orderRelationshipId?: string | null;

  @ApiProperty({ description: "The supplier's ORDERING email communication this site sends orders to" })
  @IsUUID('7')
  orderEmailCommunicationId: string;

  @ApiProperty({ description: "The supplier's ORDERING phone communication this site orders on" })
  @IsUUID('7')
  orderPhoneCommunicationId: string;

  @ApiProperty({ description: 'Whether the enrollment is active at this site', example: true })
  @IsBoolean()
  isActive: boolean;
}
