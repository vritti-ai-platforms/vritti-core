import { Trim } from '@vritti/api-sdk/decorators';
import { IsCurrencyCode } from '@vritti/api-sdk/money';
import { IsDateString, IsNotEmpty, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export class UpdateSupplierQuotationDto {
  @IsUUID('7')
  id: string;

  @Trim({ nullify: false })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  quotationNumber?: string;

  @IsOptional()
  @IsDateString()
  quotationDate?: string;

  // One of the supplier's currencies; changes only while the quotation is a draft without lines
  @IsOptional()
  @IsCurrencyCode()
  currencyCode?: string;

  // Validity changes only while the quotation is a draft
  @IsOptional()
  @IsDateString()
  validFrom?: string;

  @IsOptional()
  @IsDateString()
  validTo?: string | null;

  @Trim()
  @IsOptional()
  @IsString()
  @MaxLength(500)
  note?: string | null;
}
