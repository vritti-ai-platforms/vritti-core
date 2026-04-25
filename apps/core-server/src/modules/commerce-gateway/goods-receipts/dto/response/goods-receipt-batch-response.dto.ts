import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class GoodsReceiptBatchResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  goodsReceiptLineId: string;

  @ApiProperty()
  inventoryItemId: string;

  @ApiPropertyOptional({ nullable: true })
  inventoryItemName: string | null;

  @ApiProperty()
  locationId: string;

  @ApiPropertyOptional({ nullable: true })
  locationName: string | null;

  @ApiProperty()
  acceptedQuantity: number;

  @ApiProperty()
  rejectedQuantity: number;

  @ApiPropertyOptional({ nullable: true })
  rejectionReason: string | null;

  @ApiPropertyOptional({ nullable: true })
  manufacturingDate: string | null;

  @ApiPropertyOptional({ nullable: true })
  expiryDate: string | null;

  @ApiProperty()
  batchItemsCount: number;

  @ApiProperty()
  batchItemsQuantitySum: number;

  @ApiProperty()
  batchItemsDelta: number;

  @ApiProperty()
  isBalanced: boolean;

  @ApiProperty()
  createdAt: string;
}
