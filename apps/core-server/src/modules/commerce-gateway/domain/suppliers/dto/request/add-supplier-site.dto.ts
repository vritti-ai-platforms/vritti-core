import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsUUID } from 'class-validator';

export class AddSupplierSiteDto {
  @ApiProperty({ description: 'Site ID to enroll for this supplier' })
  @IsUUID('7')
  @IsNotEmpty()
  siteId: string;

  @ApiPropertyOptional({ description: 'Party tax registration pick for goods sourced at this site', nullable: true })
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
}
