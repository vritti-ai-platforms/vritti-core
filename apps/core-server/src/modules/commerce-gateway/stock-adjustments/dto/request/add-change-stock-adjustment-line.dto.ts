import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsUUID } from 'class-validator';

export class AddChangeStockAdjustmentLineDto {
  @ApiProperty({ description: 'Quant ID — the existing stock to adjust (deduct/correction lines)' })
  @IsUUID()
  quantId: string;

  @ApiProperty({ description: 'Line quantity (magnitude — sign comes from adjustment.type)' })
  @IsNumber()
  quantity: number;

  @ApiProperty({ description: 'UOM for the line quantity. Must be in the item allowed-UOM set.' })
  @IsUUID()
  uomId: string;
}
