import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateTime } from '@vritti/api-sdk';
import { IsIn, IsNotEmpty, IsNumber, IsOptional, IsString, IsUUID, Min } from 'class-validator';

export class CreatePurchaseOrderDto {
  @ApiProperty({ description: 'Supplier ID' })
  @IsUUID()
  supplierId: string;

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

  @ApiPropertyOptional({
    description: 'Exchange rate policy. FIXED locks the rate at PO time; VARIABLE defers to GR/invoice posting.',
    enum: ['FIXED', 'VARIABLE'],
    default: 'FIXED',
  })
  @IsOptional()
  @IsIn(['FIXED', 'VARIABLE'])
  exchangeRateType?: 'FIXED' | 'VARIABLE';

  @ApiPropertyOptional({
    description: 'FX exchange rate from supplier currency to BU currency. Required when FIXED + cross-currency.',
    example: 83.5,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  exchangeRate?: number | null;
}
