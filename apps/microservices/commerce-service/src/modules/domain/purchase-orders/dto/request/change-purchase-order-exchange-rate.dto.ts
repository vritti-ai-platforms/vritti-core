import { IsIn, IsNumber, IsOptional, IsUUID, Min } from 'class-validator';
import { ExchangeRateTypeValues } from '@/db/schema';

export class ChangePurchaseOrderExchangeRateDto {
  @IsUUID()
  id: string;

  @IsIn([ExchangeRateTypeValues.FIXED, ExchangeRateTypeValues.VARIABLE])
  exchangeRateType: 'FIXED' | 'VARIABLE';

  @IsOptional()
  @IsNumber()
  @Min(0)
  exchangeRate?: number | null;
}
