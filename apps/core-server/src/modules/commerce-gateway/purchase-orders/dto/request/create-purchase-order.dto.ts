import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateTime } from '@vritti/api-sdk';
import { IsNotEmpty, IsNumber, IsOptional, IsString, IsUUID, Matches, Min } from 'class-validator';

export class CreatePurchaseOrderDto {
  @ApiProperty({ description: 'Supplier ID' })
  @IsUUID()
  supplierId: string;

  @ApiProperty({ description: 'PO currency code (ISO 4217)', example: 'INR' })
  @IsNotEmpty()
  @IsString()
  @Matches(/^[A-Z]{3}$/, { message: 'Currency code must be a valid 3-letter ISO code.' })
  currencyCode: string;

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

  @ApiPropertyOptional({ description: 'Notes' })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ description: 'FX conversion rate from supplier currency to PO currency', example: 1 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  conversionRate?: number;
}
