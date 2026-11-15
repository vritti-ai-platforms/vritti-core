import { IsCurrencyCode } from '@vritti/api-sdk/money';
import { Type } from 'class-transformer';
import {
  ArrayUnique,
  IsArray,
  IsDateString,
  IsNumber,
  IsOptional,
  IsPositive,
  IsUUID,
  Matches,
  ValidateNested,
} from 'class-validator';

export class PurchaseOrderExchangeRateDto {
  @IsCurrencyCode()
  currencyCode: string;

  @IsNumber({ maxDecimalPlaces: 6 })
  @IsPositive()
  rate: number;
}

export class CreateLegPurchaseOrderDto {
  @IsUUID('7')
  id: string;

  @IsUUID('7')
  legId: string;

  @IsDateString({ strict: true })
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'orderDate must be YYYY-MM-DD' })
  orderDate: string;

  @IsOptional()
  @IsArray()
  @ArrayUnique((rate: PurchaseOrderExchangeRateDto) => rate.currencyCode)
  @ValidateNested({ each: true })
  @Type(() => PurchaseOrderExchangeRateDto)
  exchangeRates?: PurchaseOrderExchangeRateDto[];

  @IsOptional()
  @IsDateString({ strict: true })
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'expectedDeliveryDate must be YYYY-MM-DD' })
  expectedDeliveryDate?: string;
}
