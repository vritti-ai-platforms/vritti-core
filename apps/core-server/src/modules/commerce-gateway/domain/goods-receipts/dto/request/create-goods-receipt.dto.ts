import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Trim } from '@vritti/api-sdk/decorators';
import { IsNotEmpty, IsNumber, IsOptional, IsPositive, IsString, IsUUID } from 'class-validator';

export class CreateGoodsReceiptDto {
  @ApiProperty({ description: 'Supplier ID' })
  @IsUUID('7')
  supplierId: string;

  @ApiPropertyOptional({ description: 'Purchase order ID (optional)' })
  @IsOptional()
  @IsUUID('7')
  purchaseOrderId?: string;

  @ApiProperty({ description: 'Date the goods were received (ISO string)', example: '2026-04-10' })
  @IsString()
  @IsNotEmpty()
  receivedDate: string;

  @Trim()
  @ApiPropertyOptional({ description: 'Notes' })
  @IsOptional()
  @IsString()
  notes?: string | null;

  @ApiPropertyOptional({
    description:
      'Supplier→site exchange rate. Required when the supplier currency differs from the site currency AND the rate cannot be inherited from a FIXED-rate purchase order. Ignored when supplier currency == site currency or when inherited from a FIXED PO.',
  })
  @IsOptional()
  @IsNumber()
  @IsPositive()
  exchangeRate?: number;
}
