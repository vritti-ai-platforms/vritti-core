import { IsBoolean, IsOptional, IsUUID } from 'class-validator';

export class CreateSupplierEnrollmentDto {
  @IsUUID('7')
  supplierId: string;

  @IsUUID('7')
  paymentTermId: string;

  @IsOptional()
  @IsUUID('7')
  partyTaxRegistrationId?: string | null;

  @IsOptional()
  @IsUUID('7')
  partyBankAccountId?: string | null;

  @IsOptional()
  @IsUUID('7')
  orderRelationshipId?: string | null;

  @IsUUID('7')
  orderEmailCommunicationId: string;

  @IsUUID('7')
  orderPhoneCommunicationId: string;

  @IsBoolean()
  isActive: boolean;
}
