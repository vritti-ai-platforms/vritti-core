import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateTime, Trim } from '@vritti/api-sdk/decorators';
import { IsCurrencyCode } from '@vritti/api-sdk/money';
import { IsIn, IsNotEmpty, IsNumber, IsOptional, IsString, IsUUID, Min } from 'class-validator';

export class CreatePurchaseOrderDto {
  @ApiProperty({ description: 'Supplier ID' })
  @IsUUID('7')
  supplierId: string;

  @ApiPropertyOptional({
    description: "One of the supplier's currencies the PO is in; the supplier's default when omitted",
    example: 'USD',
  })
  @IsOptional()
  @IsCurrencyCode()
  currencyCode?: string;

  @ApiProperty({ description: 'Order date (ISO string)', example: '2026-04-10' })
  @IsString()
  @IsNotEmpty()
  orderDate: string;

  @ApiPropertyOptional({
    description: 'Expected-by date/time (UTC ISO string)',
    example: '2026-04-25T20:00:00.000Z',
  })
  @IsOptional()
  @IsString()
  @IsDateTime()
  expectedBy?: string;

  @Trim()
  @ApiPropertyOptional({ description: 'Notes' })
  @IsOptional()
  @IsString()
  notes?: string | null;

  @ApiPropertyOptional({
    description: 'Exchange rate policy. FIXED locks the rate at PO time; VARIABLE defers to GR/invoice posting.',
    enum: ['FIXED', 'VARIABLE'],
    default: 'FIXED',
  })
  @IsOptional()
  @IsIn(['FIXED', 'VARIABLE'])
  exchangeRateType?: 'FIXED' | 'VARIABLE';

  @ApiPropertyOptional({
    description: 'FX exchange rate from the PO currency to site currency. Required when FIXED + cross-currency.',
    example: 83.5,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  exchangeRate?: number | null;
}
