import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CurrencyAmountDto } from '@vritti/api-sdk';

export class GoodsReceiptItemQuantRowResponseDto {
  @ApiProperty()
  quantId: string;

  @ApiPropertyOptional({ nullable: true })
  locationName: string | null;

  @ApiPropertyOptional({ nullable: true })
  lotNumber: string | null;

  @ApiProperty()
  quantity: number;

  @ApiPropertyOptional({ type: () => CurrencyAmountDto, nullable: true })
  unitCost: CurrencyAmountDto | null;

  @ApiPropertyOptional({ type: () => CurrencyAmountDto, nullable: true })
  totalCost: CurrencyAmountDto | null;

  @ApiPropertyOptional({ type: () => CurrencyAmountDto, nullable: true })
  quantCost: CurrencyAmountDto | null;

  @ApiPropertyOptional({ type: () => CurrencyAmountDto, nullable: true })
  quantValue: CurrencyAmountDto | null;
}

export class GoodsReceiptItemQuantsResponseDto {
  @ApiProperty({ type: [GoodsReceiptItemQuantRowResponseDto] })
  rows: GoodsReceiptItemQuantRowResponseDto[];

  @ApiPropertyOptional({ nullable: true })
  currencyCode: string | null;

  @ApiPropertyOptional({ type: () => CurrencyAmountDto, nullable: true })
  grandTotal: CurrencyAmountDto | null;
}
