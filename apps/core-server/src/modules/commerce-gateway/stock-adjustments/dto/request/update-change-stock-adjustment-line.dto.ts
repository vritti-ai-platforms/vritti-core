import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsUUID } from 'class-validator';

export class UpdateChangeStockAdjustmentLineDto {
  @ApiPropertyOptional({ description: 'Quant ID — the existing stock to adjust' })
  @IsOptional()
  @IsUUID()
  quantId?: string;

  @ApiPropertyOptional({ description: 'Line quantity' })
  @IsOptional()
  @IsNumber()
  quantity?: number;

  @ApiPropertyOptional({ description: 'UOM for the line quantity' })
  @IsOptional()
  @IsUUID()
  uomId?: string;
}
