import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsCurrencyCode } from '@vritti/api-sdk/money';
import { IsNumber, IsOptional, IsPositive } from 'class-validator';

export class ChangeSupplierCurrencyDto {
  @ApiProperty({ description: 'New currency code (ISO 4217)', example: 'USD' })
  @IsCurrencyCode()
  currencyCode: string;

  @ApiPropertyOptional({ description: 'Conversion rate from current currency to new currency', example: 1.1 })
  @IsOptional()
  @IsNumber()
  @IsPositive()
  conversionRate?: number;
}
