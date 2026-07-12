import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsUUID } from 'class-validator';

export class UpdateChangeStockAdjustmentLineDto {
  @ApiPropertyOptional({ description: 'Quant ID — the existing stock to adjust' })
  @IsOptional()
  @IsUUID()
  quantId?: string;

  @ApiPropertyOptional({ description: 'Line quantity in the line UOM' })
  @IsOptional()
  @IsNumber()
  uomQty?: number;

  @ApiPropertyOptional({ description: 'UOM the line quantity is expressed in' })
  @IsOptional()
  @IsUUID()
  uomId?: string;
}
