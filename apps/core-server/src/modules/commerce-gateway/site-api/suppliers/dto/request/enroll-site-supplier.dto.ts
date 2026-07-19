import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsUUID } from 'class-validator';

export class EnrollSiteSupplierDto {
  @ApiProperty({ description: 'Supplier ID to enroll for this site' })
  @IsUUID()
  @IsNotEmpty()
  supplierId: string;

  @ApiPropertyOptional({ description: 'Party tax registration pick for goods sourced at this site', nullable: true })
  @IsOptional()
  @IsUUID()
  partyTaxRegistrationId?: string | null;

  @ApiPropertyOptional({ description: 'Party bank account pick for payments from this site', nullable: true })
  @IsOptional()
  @IsUUID()
  partyBankAccountId?: string | null;
}
