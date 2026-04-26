import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsUUID } from 'class-validator';

// A line is either a register intent (location + lot draft) for OPENING_STOCK
// or a change intent (quant_id) for deduct/CORRECTION. Service-side CHECK enforces XOR.
export class AddStockAdjustmentLineDto {
  @ApiPropertyOptional({ description: 'Stock adjustment lot draft ID (OPENING_STOCK + tracking=lot/serial)' })
  @IsOptional()
  @IsUUID()
  stockAdjustmentLotId?: string | null;

  @ApiPropertyOptional({ description: 'Storage location ID (OPENING_STOCK)' })
  @IsOptional()
  @IsUUID()
  locationId?: string | null;

  @ApiPropertyOptional({ description: 'Quant ID — the existing stock to adjust (deduct/CORRECTION)' })
  @IsOptional()
  @IsUUID()
  quantId?: string | null;

  @ApiProperty({ description: 'Line quantity (magnitude — sign comes from adjustment.type)' })
  @IsNumber()
  quantity: number;
}
