import { IsCurrencyCode } from '@vritti/api-sdk/money';
import { IsNumber, IsOptional, IsPositive, IsUUID } from 'class-validator';

export class ChangeSupplierCurrencyDto {
  @IsUUID('7')
  id: string;

  @IsCurrencyCode()
  currencyCode: string;

  @IsOptional()
  @IsNumber()
  @IsPositive()
  conversionRate?: number;
}
