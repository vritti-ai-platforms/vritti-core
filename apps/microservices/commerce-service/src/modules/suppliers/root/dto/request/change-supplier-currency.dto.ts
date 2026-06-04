import { IsCurrencyCode } from '@vritti/api-sdk';
import { IsNumber, IsOptional, IsPositive } from 'class-validator';

export class ChangeSupplierCurrencyDto {
  @IsCurrencyCode()
  currencyCode: string;

  @IsOptional()
  @IsNumber()
  @IsPositive()
  conversionRate?: number;
}
