import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CurrencyAmountDto } from '@vritti/api-sdk';

// One row of a location's stocked items (grouped across quants, non-zero).
export class LocationItemResponseDto {
  @ApiProperty() inventoryItemId: string;
  @ApiProperty() itemName: string;
  @ApiProperty() itemCode: string;
  @ApiPropertyOptional({ nullable: true }) uomSymbol: string | null;
  @ApiProperty() totalQuantity: number;
  @ApiProperty() availableQuantity: number;
  @ApiPropertyOptional({ type: CurrencyAmountDto, nullable: true }) totalValue: CurrencyAmountDto | null;
  @ApiProperty() batchCount: number;
}
