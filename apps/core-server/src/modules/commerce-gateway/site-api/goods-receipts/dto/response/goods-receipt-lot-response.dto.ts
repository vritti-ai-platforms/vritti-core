import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CurrencyAmountDto } from '@vritti/api-sdk/money';

export class GoodsReceiptLotResponseDto {
  @ApiProperty() id: string;
  @ApiProperty() goodsReceiptItemId: string;
  @ApiProperty() lotNumber: string;
  @ApiPropertyOptional({ nullable: true }) manufacturingDate: string | null;
  @ApiPropertyOptional({ nullable: true }) expiryDate: string | null;
  @ApiPropertyOptional({ nullable: true, description: 'Set after publish' })
  resolvedLotId: string | null;
  @ApiPropertyOptional({ type: () => CurrencyAmountDto, nullable: true }) mrp: CurrencyAmountDto | null;
  @ApiProperty() linesCount: number;
  @ApiProperty() totalQuantity: number;
  @ApiProperty() metadata: Record<string, unknown>;
  @ApiProperty() createdAt: string;
}
