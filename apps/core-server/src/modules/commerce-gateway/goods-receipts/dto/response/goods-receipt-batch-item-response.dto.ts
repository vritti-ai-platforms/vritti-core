import { ApiProperty } from '@nestjs/swagger';

export class GoodsReceiptBatchItemResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  goodsReceiptBatchId: string;

  @ApiProperty()
  quantity: number;

  @ApiProperty()
  createdAt: string;
}
