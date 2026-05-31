import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CurrencyAmountDto } from '@vritti/api-sdk';

export class GoodsReceiptItemsCostRowResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  inventoryItemId: string;

  @ApiProperty()
  inventoryItemName: string;

  @ApiProperty()
  uomSymbol: string;

  @ApiProperty()
  quantity: number;

  @ApiPropertyOptional({ type: () => CurrencyAmountDto, nullable: true })
  unitPrice: CurrencyAmountDto | null;

  @ApiPropertyOptional({ type: () => CurrencyAmountDto, nullable: true })
  lineTotal: CurrencyAmountDto | null;
}

export class GoodsReceiptItemsCostResponseDto {
  @ApiProperty({ type: [GoodsReceiptItemsCostRowResponseDto] })
  rows: GoodsReceiptItemsCostRowResponseDto[];

  @ApiPropertyOptional({ nullable: true })
  currencyCode: string | null;

  @ApiPropertyOptional({ type: () => CurrencyAmountDto, nullable: true })
  grandTotal: CurrencyAmountDto | null;
}
