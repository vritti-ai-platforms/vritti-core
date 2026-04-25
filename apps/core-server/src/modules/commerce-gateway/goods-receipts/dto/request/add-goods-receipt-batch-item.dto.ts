import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, Min } from 'class-validator';

export class AddGoodsReceiptBatchItemDto {
  @ApiProperty()
  @IsNumber()
  @Min(0.001)
  quantity: number;
}
