import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsOptional, IsPositive, IsString, IsUUID } from 'class-validator';

export class CreateGoodsReceiptDto {
  @ApiProperty({ description: 'Supplier ID' })
  @IsUUID()
  supplierId: string;

  @ApiPropertyOptional({ description: 'Purchase order ID (optional)' })
  @IsOptional()
  @IsUUID()
  purchaseOrderId?: string;

  @ApiPropertyOptional({ description: 'User ID of the person who received the goods' })
  @IsOptional()
  @IsUUID()
  receivedBy?: string;

  @ApiProperty({ description: 'Date the goods were received (ISO string)', example: '2026-04-10' })
  @IsString()
  @IsNotEmpty()
  receivedDate: string;

  @ApiPropertyOptional({ description: 'Notes' })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({
    description:
      'Supplier→BU exchange rate. Required when the supplier currency differs from the BU currency AND the rate cannot be inherited from a FIXED-rate purchase order. Ignored when supplier currency == BU currency or when inherited from a FIXED PO.',
  })
  @IsOptional()
  @IsNumber()
  @IsPositive()
  exchangeRate?: number;
}
