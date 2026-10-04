import { IsBoolean, IsOptional, IsUUID } from 'class-validator';

export class UpdateSupplierSiteDto {
  @IsUUID('7')
  id: string;

  @IsOptional()
  @IsUUID('7')
  partyTaxRegistrationId?: string | null;

  @IsOptional()
  @IsUUID('7')
  partyBankAccountId?: string | null;

  @IsOptional()
  @IsUUID('7')
  orderRelationshipId?: string | null;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
