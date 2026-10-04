import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsUUID } from 'class-validator';

export class UpdateSiteSupplierEnrollmentDto {
  @ApiPropertyOptional({ description: 'Party tax registration pick for goods sourced at this site', nullable: true })
  @IsOptional()
  @IsUUID('7')
  partyTaxRegistrationId?: string | null;

  @ApiPropertyOptional({ description: 'Party bank account pick for payments from this site', nullable: true })
  @IsOptional()
  @IsUUID('7')
  partyBankAccountId?: string | null;

  @ApiPropertyOptional({ description: 'Whether the enrollment is active' })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
