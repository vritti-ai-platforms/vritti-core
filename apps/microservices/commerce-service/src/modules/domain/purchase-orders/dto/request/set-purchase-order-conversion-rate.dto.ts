import { IsCurrencyCode } from '@vritti/api-sdk/money';
import { IsNumber, IsPositive, IsUUID } from 'class-validator';

export class SetPurchaseOrderConversionRateDto {
  @IsUUID('7')
  id: string;

  // One of the supplier's currencies other than the PO's
  @IsCurrencyCode()
  currencyCode: string;

  // 1 unit of currencyCode in the PO currency
  @IsNumber({ maxDecimalPlaces: 6 })
  @IsPositive()
  rate: number;
}
