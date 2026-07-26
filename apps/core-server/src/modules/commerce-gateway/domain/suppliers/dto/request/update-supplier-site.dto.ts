import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsUUID } from 'class-validator';

export class UpdateSupplierSiteDto {
  @ApiPropertyOptional({ description: 'Party tax registration pick for goods sourced at this site', nullable: true })
  @IsOptional()
  @IsUUID()
  partyTaxRegistrationId?: string | null;

  @ApiPropertyOptional({ description: 'Party bank account pick for payments from this site', nullable: true })
  @IsOptional()
  @IsUUID()
  partyBankAccountId?: string | null;

  @ApiPropertyOptional({ description: 'Company-person relationship pick for the order contact at this site', nullable: true })
  @IsOptional()
  @IsUUID()
  orderRelationshipId?: string | null;

  @ApiPropertyOptional({ description: 'Whether the site enrollment is active' })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
