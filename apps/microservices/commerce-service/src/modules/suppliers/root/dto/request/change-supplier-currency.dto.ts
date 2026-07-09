import { IsCurrencyCode } from '@vritti/api-sdk/money';
import { IsNumber, IsOptional, IsPositive } from 'class-validator';

export class ChangeSupplierCurrencyDto {
  @IsCurrencyCode()
  currencyCode: string;

  @IsOptional()
  @IsNumber()
  @IsPositive()
  conversionRate?: number;
}
