import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsUUID } from 'class-validator';

export class UpdateOpeningStockAdjustmentLineDto {
  @ApiPropertyOptional({ description: 'Storage location ID' })
  @IsOptional()
  @IsUUID('7')
  locationId?: string;

  @ApiPropertyOptional({ description: 'Stock adjustment lot draft ID' })
  @IsOptional()
  @IsUUID('7')
  stockAdjustmentLotId?: string | null;

  @ApiPropertyOptional({ description: 'Line quantity in the line UOM' })
  @IsOptional()
  @IsNumber()
  uomQty?: number;

  @ApiPropertyOptional({ description: 'UOM the line quantity is expressed in' })
  @IsOptional()
  @IsUUID('7')
  uomId?: string;
}
