import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class GoodsReceiptLineResponseDto {
  @ApiProperty() id: string;
  @ApiProperty() goodsReceiptItemId: string;
  @ApiPropertyOptional({ nullable: true }) goodsReceiptLotId: string | null;
  @ApiProperty() locationId: string;
  @ApiPropertyOptional({ nullable: true }) locationName: string | null;
  @ApiPropertyOptional({ nullable: true }) locationPath: string | null;
  @ApiPropertyOptional({ nullable: true }) lotNumber: string | null;
  @ApiPropertyOptional({ nullable: true }) manufacturingDate: string | null;
  @ApiPropertyOptional({ nullable: true }) expiryDate: string | null;

  @ApiProperty() quantity: number;
  @ApiProperty({ description: "Quantity in the inventory item's primary UOM" }) primaryUomQty: number;
  @ApiPropertyOptional({ nullable: true }) primaryUomSymbol: string | null;
  @ApiPropertyOptional({ nullable: true, description: 'Set after posting' })
  resolvedQuantId: string | null;
  @ApiProperty() isBalanced: boolean;
  @ApiProperty() lineItemsCount: number;
  @ApiProperty() createdAt: string;
}
