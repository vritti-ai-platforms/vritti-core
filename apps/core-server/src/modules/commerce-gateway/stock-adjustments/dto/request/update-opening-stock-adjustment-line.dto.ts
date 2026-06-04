import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsUUID } from 'class-validator';

export class UpdateOpeningStockAdjustmentLineDto {
  @ApiPropertyOptional({ description: 'Storage location ID' })
  @IsOptional()
  @IsUUID()
  locationId?: string;

  @ApiPropertyOptional({ description: 'Stock adjustment lot draft ID' })
  @IsOptional()
  @IsUUID()
  stockAdjustmentLotId?: string | null;

  @ApiPropertyOptional({ description: 'Line quantity in the line UOM' })
  @IsOptional()
  @IsNumber()
  uomQty?: number;

  @ApiPropertyOptional({ description: 'UOM the line quantity is expressed in' })
  @IsOptional()
  @IsUUID()
  uomId?: string;
}
