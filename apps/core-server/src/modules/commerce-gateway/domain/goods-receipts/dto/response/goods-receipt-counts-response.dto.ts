import { ApiProperty } from '@nestjs/swagger';

export class GoodsReceiptCountsResponseDto {
  @ApiProperty({
    description: 'Items counted on the receipt, listed by both its breakdown and its items cost',
    example: 4,
  })
  itemCount: number;
}
