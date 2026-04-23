import { IsCurrencyCode } from '@vritti/api-sdk';
import { IsNumber, IsOptional, Min } from 'class-validator';

export class ChangePurchaseOrderCurrencyDto {
  @IsCurrencyCode()
  currencyCode: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  conversionRate?: number;
}
