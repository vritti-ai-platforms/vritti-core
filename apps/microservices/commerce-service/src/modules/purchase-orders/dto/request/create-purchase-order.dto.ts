import { IsNotEmpty, IsNumber, IsOptional, IsString, IsUUID, Matches, Min } from 'class-validator';
import { IsZonedIsoDateString } from '@vritti/api-sdk';

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
  @IsZonedIsoDateString()
  expectedBy?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  conversionRate?: number;
}
