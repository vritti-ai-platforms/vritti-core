import { IsBoolean, IsOptional, IsUUID } from 'class-validator';

export class UpdateSupplierSiteDto {
  @IsUUID()
  id: string;

  @IsOptional()
  @IsUUID()
  partyTaxRegistrationId?: string | null;

  @IsOptional()
  @IsUUID()
  partyBankAccountId?: string | null;

  @IsOptional()
  @IsUUID()
  orderContactId?: string | null;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
