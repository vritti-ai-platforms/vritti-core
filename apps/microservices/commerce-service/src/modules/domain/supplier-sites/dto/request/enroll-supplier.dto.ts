import { IsOptional, IsUUID } from 'class-validator';

export class EnrollSupplierDto {
  @IsUUID()
  supplierId: string;

  @IsOptional()
  @IsUUID()
  partyTaxRegistrationId?: string | null;

  @IsOptional()
  @IsUUID()
  partyBankAccountId?: string | null;
}
