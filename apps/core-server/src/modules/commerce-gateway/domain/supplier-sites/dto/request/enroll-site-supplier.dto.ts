import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsUUID } from 'class-validator';

export class EnrollSiteSupplierDto {
  @ApiProperty({ description: 'Supplier ID to enroll for this site' })
  @IsUUID('7')
  @IsNotEmpty()
  supplierId: string;

  @ApiProperty({ description: 'Payment term this site buys from the supplier on' })
  @IsUUID('7')
  paymentTermId: string;

  @ApiProperty({ description: "Supplier's tax registration this site is billed under" })
  @IsUUID('7')
  partyTaxRegistrationId: string;

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
