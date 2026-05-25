import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsUUID } from 'class-validator';

export class AddOpeningStockAdjustmentLineDto {
  @ApiProperty({ description: 'Storage location ID (required for OPENING_STOCK lines)' })
  @IsUUID()
  locationId: string;

  @ApiPropertyOptional({ description: 'Stock adjustment lot draft ID (required for lot/lot_serial-tracked items)' })
  @IsOptional()
  @IsUUID()
  stockAdjustmentLotId?: string | null;

  @ApiProperty({ description: 'Line quantity in the line UOM (magnitude — sign comes from adjustment.type)' })
  @IsNumber()
  uomQty: number;

  @ApiProperty({ description: 'UOM the line quantity is expressed in. Must be in the item allowed-UOM set.' })
  @IsUUID()
  uomId: string;
}
