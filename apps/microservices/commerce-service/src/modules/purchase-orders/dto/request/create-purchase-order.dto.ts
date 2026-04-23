import { IsDateTime } from '@vritti/api-sdk';
import { IsNotEmpty, IsNumber, IsOptional, IsString, IsUUID, Matches, Min } from 'class-validator';

export class CreatePurchaseOrderDto {
  @IsUUID()
  supplierId: string;

  @IsNotEmpty()
  @IsString()
  @Matches(/^[A-Z]{3}$/, { message: 'Currency code must be a valid 3-letter ISO code.' })
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
