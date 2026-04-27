import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class GoodsReceiptLotResponseDto {
  @ApiProperty() id: string;
  @ApiProperty() goodsReceiptItemId: string;
  @ApiProperty() lotNumber: string;
  @ApiPropertyOptional({ nullable: true }) manufacturingDate: string | null;
  @ApiPropertyOptional({ nullable: true }) expiryDate: string | null;
  @ApiPropertyOptional({ nullable: true, description: 'Set after publish' })
  resolvedLotId: string | null;
  @ApiProperty() linesCount: number;
  @ApiProperty() totalQuantity: number;
  @ApiProperty() isBalanced: boolean;
  @ApiProperty() metadata: Record<string, unknown>;
  @ApiProperty() createdAt: string;
}
