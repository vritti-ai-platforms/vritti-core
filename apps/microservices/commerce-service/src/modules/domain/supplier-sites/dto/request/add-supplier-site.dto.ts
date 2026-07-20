import { IsOptional, IsUUID } from 'class-validator';

export class AddSupplierSiteDto {
  @IsUUID()
  supplierId: string;

  @IsUUID()
  siteId: string;

  @IsOptional()
  @IsUUID()
  partyTaxRegistrationId?: string | null;

  @IsOptional()
  @IsUUID()
  partyBankAccountId?: string | null;

  @IsOptional()
  @IsUUID()
  orderContactId?: string | null;
}
