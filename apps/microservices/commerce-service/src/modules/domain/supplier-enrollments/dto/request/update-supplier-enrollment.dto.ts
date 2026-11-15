import { IsOptional, IsUUID, ValidateIf } from 'class-validator';

export class UpdateSupplierEnrollmentDto {
  @IsUUID('7')
  supplierId: string;

  @IsOptional()
  @IsUUID('7')
  paymentTermId?: string;

  @IsOptional()
  @IsUUID('7')
  partyTaxRegistrationId?: string | null;

  @IsOptional()
  @IsUUID('7')
  partyBankAccountId?: string | null;

  @IsOptional()
  @IsUUID('7')
  orderRelationshipId?: string | null;

  @ValidateIf((_, value) => value !== undefined)
  @IsUUID('7')
  orderEmailCommunicationId?: string;

  @ValidateIf((_, value) => value !== undefined)
  @IsUUID('7')
  orderPhoneCommunicationId?: string;
}
