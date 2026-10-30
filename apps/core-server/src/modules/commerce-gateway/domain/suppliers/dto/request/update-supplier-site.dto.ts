import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsUUID } from 'class-validator';

export class UpdateSupplierSiteDto {
  @ApiPropertyOptional({ description: 'Payment term this site buys from the supplier on' })
  @IsOptional()
  @IsUUID('7')
  paymentTermId?: string;

  @ApiPropertyOptional({ description: "Supplier's tax registration this site is billed under" })
  @IsOptional()
  @IsUUID('7')
  partyTaxRegistrationId?: string;

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
}
