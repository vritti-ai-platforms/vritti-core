import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';

export class CreatePurchaseOrderDto {
  @ApiProperty({ description: 'Supplier ID' })
  @IsUUID()
  supplierId: string;

  @ApiProperty({ description: 'Order date (ISO string)', example: '2026-04-10' })
  @IsString()
  @IsNotEmpty()
  orderDate: string;

  @ApiPropertyOptional({ description: 'Expected-by date/time (ISO string with timezone)' })
  @IsOptional()
  @IsString()
  expectedBy?: string;

  @ApiPropertyOptional({ description: 'Notes' })
  @IsOptional()
  @IsString()
  notes?: string;
}
