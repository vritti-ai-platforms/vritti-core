import { IsDateTime } from '@vritti/api-sdk/decorators';
import { IsIn, IsNotEmpty, IsNumber, IsOptional, IsString, IsUUID, Min } from 'class-validator';
import { ExchangeRateTypeValues } from '@/db/schema';

export class CreatePurchaseOrderDto {
  @IsUUID()
  supplierId: string;

  @IsNotEmpty()
  @IsString()
  orderDate: string;

  @IsOptional()
  @IsDateTime()
  expectedBy?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsIn([ExchangeRateTypeValues.FIXED, ExchangeRateTypeValues.VARIABLE])
  exchangeRateType?: 'FIXED' | 'VARIABLE';

  @IsOptional()
  @IsNumber()
  @Min(0)
  exchangeRate?: number | null;
}
