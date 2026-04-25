import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class GoodsReceiptItemResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  goodsReceiptId: string;

  @ApiProperty()
  inventoryItemId: string;

  @ApiPropertyOptional({ nullable: true })
  inventoryItemName: string | null;

  @ApiProperty()
  acceptedQuantity: number;

  @ApiProperty()
  rejectedQuantity: number;

  @ApiProperty()
  createdAt: string;
}
