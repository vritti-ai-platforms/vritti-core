import { Trim } from '@vritti/api-sdk/decorators';
import { IsCurrencyCode } from '@vritti/api-sdk/money';
import { IsDateString, IsNotEmpty, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export class CreateSupplierQuotationDto {
  @IsUUID('7')
  supplierId: string;

  @Trim({ nullify: false })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  quotationNumber: string;

  @IsDateString()
  quotationDate: string;

  // One of the supplier's currencies; the supplier's default when omitted
  @IsOptional()
  @IsCurrencyCode()
  currencyCode?: string;

  @IsDateString()
  validFrom: string;

  @IsOptional()
  @IsDateString()
  validTo?: string | null;

  @Trim()
  @IsOptional()
  @IsString()
  @MaxLength(500)
  note?: string | null;
}
