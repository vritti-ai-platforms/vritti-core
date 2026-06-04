import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsUUID } from 'class-validator';

export class AddChangeStockAdjustmentLineDto {
  @ApiProperty({ description: 'Quant ID — the existing stock to adjust (deduct/correction lines)' })
  @IsUUID()
  quantId: string;

  @ApiProperty({ description: 'Line quantity in the line UOM (magnitude — sign comes from adjustment.type)' })
  @IsNumber()
  uomQty: number;

  @ApiProperty({ description: 'UOM the line quantity is expressed in. Must be in the item allowed-UOM set.' })
  @IsUUID()
  uomId: string;
}
