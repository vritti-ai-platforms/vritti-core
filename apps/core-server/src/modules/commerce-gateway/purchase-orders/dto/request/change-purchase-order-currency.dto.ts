import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString, Matches, Min } from 'class-validator';

export class ChangePurchaseOrderCurrencyDto {
  @ApiProperty({ description: 'PO currency code (ISO 4217)', example: 'INR' })
  @IsString()
  @Matches(/^[A-Z]{3}$/, { message: 'Currency code must be a valid 3-letter ISO code.' })
  currencyCode: string;

  @ApiPropertyOptional({ description: 'FX conversion rate from supplier currency to PO currency', example: 1 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  conversionRate?: number;
}
