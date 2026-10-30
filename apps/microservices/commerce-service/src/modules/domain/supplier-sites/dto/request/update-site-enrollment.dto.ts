import { IsOptional, IsUUID } from 'class-validator';

export class UpdateSiteEnrollmentDto {
  @IsUUID('7')
  supplierId: string;

  @IsOptional()
  @IsUUID('7')
  paymentTermId?: string;

  @IsOptional()
  @IsUUID('7')
  partyTaxRegistrationId?: string;

  @IsOptional()
  @IsUUID('7')
  partyBankAccountId?: string | null;

  @IsOptional()
  @IsUUID('7')
  orderRelationshipId?: string | null;
}
