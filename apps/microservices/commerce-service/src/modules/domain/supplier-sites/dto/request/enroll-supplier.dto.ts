import { IsOptional, IsUUID } from 'class-validator';

export class EnrollSupplierDto {
  @IsUUID('7')
  supplierId: string;

  @IsOptional()
  @IsUUID('7')
  partyTaxRegistrationId?: string | null;

  @IsOptional()
  @IsUUID('7')
  partyBankAccountId?: string | null;
}
