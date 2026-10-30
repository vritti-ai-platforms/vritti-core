import { IsOptional, IsUUID } from 'class-validator';

export class AddSupplierSiteDto {
  @IsUUID('7')
  supplierId: string;

  @IsUUID('7')
  siteId: string;

  @IsUUID('7')
  paymentTermId: string;

  @IsUUID('7')
  partyTaxRegistrationId: string;

  @IsOptional()
  @IsUUID('7')
  partyBankAccountId?: string | null;

  @IsOptional()
  @IsUUID('7')
  orderRelationshipId?: string | null;
}
