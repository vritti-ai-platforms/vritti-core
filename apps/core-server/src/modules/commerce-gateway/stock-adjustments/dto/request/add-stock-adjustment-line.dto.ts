import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString, IsUUID } from 'class-validator';

export class AddStockAdjustmentLineDto {
  @ApiPropertyOptional({ description: 'Batch ID (required for non-OPENING_STOCK)' })
  @IsOptional()
  @IsUUID()
  batchId?: string;

  @ApiPropertyOptional({ description: 'Storage location ID (required for OPENING_STOCK)' })
  @IsOptional()
  @IsUUID()
  locationId?: string;

  @IsNumber()
  quantity: number;

  @ApiPropertyOptional({ description: 'Manufacturing date (OPENING_STOCK)' })
  @IsOptional()
  @IsString()
  manufacturingDate?: string;

  @ApiPropertyOptional({ description: 'Expiry date (OPENING_STOCK)' })
  @IsOptional()
  @IsString()
  expiryDate?: string;
}
