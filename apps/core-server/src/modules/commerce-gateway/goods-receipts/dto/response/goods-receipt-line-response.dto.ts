import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class GoodsReceiptLineResponseDto {
  @ApiProperty() id: string;
  @ApiProperty() goodsReceiptItemId: string;
  @ApiPropertyOptional({ nullable: true }) goodsReceiptLotId: string | null;
  @ApiProperty() locationId: string;
  @ApiPropertyOptional({ nullable: true }) locationName: string | null;
  // Lot info (denormalized — for display)
  @ApiPropertyOptional({ nullable: true }) lotNumber: string | null;
  @ApiPropertyOptional({ nullable: true }) manufacturingDate: string | null;
  @ApiPropertyOptional({ nullable: true }) expiryDate: string | null;

  @ApiProperty() quantity: number;
  @ApiPropertyOptional({ nullable: true, description: 'Set after publish' })
  resolvedQuantId: string | null;
  @ApiProperty() isBalanced: boolean;
  @ApiProperty() lineItemsCount: number;
  @ApiProperty() metadata: Record<string, unknown>;
  @ApiProperty() createdAt: string;
}
