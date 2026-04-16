import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, Min } from 'class-validator';

export class UpdateStockAdjustmentDto {
  @ApiProperty({ description: 'Adjustment quantity', example: 100 })
  @IsNumber()
  @Min(0.001)
  quantity: number;
}
