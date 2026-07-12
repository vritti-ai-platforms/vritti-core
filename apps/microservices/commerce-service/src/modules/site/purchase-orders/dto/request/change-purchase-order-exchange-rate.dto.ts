import { IsIn, IsNumber, IsOptional, Min } from 'class-validator';
import { ExchangeRateTypeValues } from '@/db/schema';

export class ChangePurchaseOrderExchangeRateDto {
  @IsIn([ExchangeRateTypeValues.FIXED, ExchangeRateTypeValues.VARIABLE])
  exchangeRateType: 'FIXED' | 'VARIABLE';

  @IsOptional()
  @IsNumber()
  @Min(0)
  exchangeRate?: number | null;
}
