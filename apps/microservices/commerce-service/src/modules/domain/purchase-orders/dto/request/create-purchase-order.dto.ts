import { IsDateTime, Trim } from '@vritti/api-sdk/decorators';
import { IsCurrencyCode } from '@vritti/api-sdk/money';
import { IsIn, IsNotEmpty, IsNumber, IsOptional, IsString, IsUUID, Min } from 'class-validator';
import { ExchangeRateTypeValues } from '@/db/schema';

export class CreatePurchaseOrderDto {
  @IsUUID('7')
  supplierId: string;

  // One of the supplier's currencies; the supplier's default when omitted
  @IsOptional()
  @IsCurrencyCode()
  currencyCode?: string;

  @IsNotEmpty()
  @IsString()
  orderDate: string;

  @IsOptional()
  @IsDateTime()
  expectedBy?: string;

  @Trim()
  @IsOptional()
  @IsString()
  notes?: string | null;

  @IsOptional()
  @IsIn([ExchangeRateTypeValues.FIXED, ExchangeRateTypeValues.VARIABLE])
  exchangeRateType?: 'FIXED' | 'VARIABLE';

  @IsOptional()
  @IsNumber()
  @Min(0)
  exchangeRate?: number | null;
}
