import { Trim } from '@vritti/api-sdk/decorators';
import { IsCurrencyCode } from '@vritti/api-sdk/money';
import { IsDateString, IsNumber, IsOptional, IsPositive, IsString, IsUUID, Matches } from 'class-validator';

export class CreatePurchaseOrderDto {
  @IsUUID('7')
  supplierId: string;

  @IsOptional()
  @IsCurrencyCode()
  currencyCode?: string;

  @IsDateString({ strict: true })
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'orderDate must be YYYY-MM-DD' })
  orderDate: string;

  @IsDateString({ strict: true })
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'taxDate must be YYYY-MM-DD' })
  taxDate: string;

  @Trim()
  @IsOptional()
  @IsString()
  notes?: string | null;

  @IsNumber({ maxDecimalPlaces: 6 })
  @IsPositive()
  exchangeRate: number;
}
