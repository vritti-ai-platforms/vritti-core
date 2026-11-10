import { PriceWindowResponseDto } from '@commerce/supplier-item-prices/dto/response/supplier-item-price-history-response.dto';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class PriceHistoryLineResponseDto {
  @ApiProperty({ description: 'Supplier item the line draws; stable across refetches, so the line keeps its colour' })
  id: string;

  @ApiProperty({ description: 'Supplier ID' })
  supplierId: string;

  @ApiProperty({ description: 'Supplier name, with the unit it quotes in when the supplier draws more than one line' })
  label: string;

  @ApiPropertyOptional({ type: PriceWindowResponseDto, description: 'Price in force today', nullable: true })
  current: PriceWindowResponseDto | null;

  @ApiPropertyOptional({
    type: PriceWindowResponseDto,
    description: 'The window the current one replaced',
    nullable: true,
  })
  previous: PriceWindowResponseDto | null;

  @ApiPropertyOptional({ type: PriceWindowResponseDto, description: 'The next scheduled window', nullable: true })
  next: PriceWindowResponseDto | null;

  @ApiProperty({
    type: [PriceWindowResponseDto],
    description: "Every window, oldest first, in the history's currency and unit",
  })
  windows: PriceWindowResponseDto[];
}

export class InventoryItemPriceHistoryResponseDto {
  @ApiPropertyOptional({
    description: "Currency every line is in — the context's; null when none is chosen",
    nullable: true,
  })
  currency: string | null;

  @ApiProperty({
    type: [PriceHistoryLineResponseDto],
    description:
      'The lines drawn: the suppliers asked for, or by default the preferred then most recently priced; at most 8',
  })
  lines: PriceHistoryLineResponseDto[];
}
