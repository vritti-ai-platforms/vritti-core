import { ApiProperty } from '@nestjs/swagger';

export class GoodsReceiptBatchItemResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  goodsReceiptBatchId: string;

  @ApiProperty()
  serialNumber: string;

  @ApiProperty()
  createdAt: string;
}
