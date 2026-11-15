import { ApiProperty } from '@nestjs/swagger';

export class CreatedLegGoodsReceiptResponseDto {
  @ApiProperty({ description: 'The draft goods receipt created for the leg, completed in Goods Receipts' })
  goodsReceiptId: string;
}
