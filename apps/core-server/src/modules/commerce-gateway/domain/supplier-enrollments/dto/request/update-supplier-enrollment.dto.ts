import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsUUID } from 'class-validator';

export class UpdateSupplierEnrollmentDto {
  @ApiPropertyOptional({ description: 'Payment term this site buys from the supplier on' })
  @IsOptional()
  @IsUUID('7')
  paymentTermId?: string;

  @ApiPropertyOptional({
    description: "Supplier's GSTIN or VAT registration this site is invoiced under; null clears it",
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

  @ApiPropertyOptional({ description: "The supplier's ORDERING email communication this site sends orders to" })
  @IsOptional()
  @IsUUID('7')
  orderEmailCommunicationId?: string;

  @ApiPropertyOptional({ description: "The supplier's ORDERING phone communication this site orders on" })
  @IsOptional()
  @IsUUID('7')
  orderPhoneCommunicationId?: string;
}
