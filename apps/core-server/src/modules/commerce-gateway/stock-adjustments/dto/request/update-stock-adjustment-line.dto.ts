import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsUUID } from 'class-validator';

export class UpdateStockAdjustmentLineDto {
  @ApiPropertyOptional({ description: 'Line quantity' })
  @IsOptional()
  @IsNumber()
  quantity?: number;

  @ApiPropertyOptional({ description: 'Stock adjustment lot draft ID' })
  @IsOptional()
  @IsUUID()
  stockAdjustmentLotId?: string | null;

  @ApiPropertyOptional({ description: 'Storage location ID' })
  @IsOptional()
  @IsUUID()
  locationId?: string | null;

  @ApiPropertyOptional({ description: 'Quant ID' })
  @IsOptional()
  @IsUUID()
  quantId?: string | null;

  @ApiPropertyOptional({ description: 'UOM for the line quantity' })
  @IsOptional()
  @IsUUID()
  uomId?: string;
}
