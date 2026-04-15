import { ApiProperty } from '@nestjs/swagger';
import { IsNumber } from 'class-validator';

export class UpdateStockAdjustmentLineItemDto {
  @ApiProperty({ description: 'Line item quantity' })
  @IsNumber()
  quantity: number;
}
