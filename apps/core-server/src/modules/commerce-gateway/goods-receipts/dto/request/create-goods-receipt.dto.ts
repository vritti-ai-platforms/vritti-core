import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';

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
}
