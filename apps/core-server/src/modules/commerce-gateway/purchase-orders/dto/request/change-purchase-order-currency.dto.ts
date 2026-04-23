import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsCurrencyCode } from '@vritti/api-sdk';
import { IsNumber, IsOptional, Min } from 'class-validator';

export class ChangePurchaseOrderCurrencyDto {
  @ApiProperty({ description: 'PO currency code (ISO 4217)', example: 'INR' })
  @IsCurrencyCode()
  currencyCode: string;

  @ApiPropertyOptional({ description: 'FX conversion rate from supplier currency to PO currency', example: 1 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  conversionRate?: number;
}
