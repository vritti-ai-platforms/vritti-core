import { IsCurrencyCode, IsDateTime } from '@vritti/api-sdk';
import { IsNotEmpty, IsNumber, IsOptional, IsString, IsUUID, Min } from 'class-validator';

export class CreatePurchaseOrderDto {
  @IsUUID()
  supplierId: string;

  @IsNotEmpty()
  @IsCurrencyCode()
  currencyCode: string;

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
  @IsNumber()
  @Min(0)
  conversionRate?: number;
}
