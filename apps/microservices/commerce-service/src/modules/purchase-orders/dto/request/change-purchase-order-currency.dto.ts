import { IsNumber, IsOptional, IsString, Matches, Min } from 'class-validator';

export class ChangePurchaseOrderCurrencyDto {
  @IsString()
  @Matches(/^[A-Z]{3}$/)
  currencyCode: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  conversionRate?: number;
}
