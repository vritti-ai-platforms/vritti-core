import { DisplayUomQuantityResponseDto } from '@commerce/uom/dto/response/display-uom-quantity-response.dto';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CurrencyAmountDto } from '@vritti/api-sdk/money';

// One row of a location's stocked items (grouped across quants, non-zero).
export class LocationItemDisplayResponseDto {
  @ApiProperty({ type: DisplayUomQuantityResponseDto, nullable: true })
  totalQuantity: DisplayUomQuantityResponseDto | null;

  @ApiProperty({ type: DisplayUomQuantityResponseDto, nullable: true })
  availableQuantity: DisplayUomQuantityResponseDto | null;
}

export class LocationItemResponseDto {
  @ApiProperty() inventoryItemId: string;
  @ApiProperty() itemName: string;
  @ApiProperty() itemSku: string;
  @ApiProperty() uomSymbol: string;
  @ApiProperty() totalQuantity: number;
  @ApiProperty() availableQuantity: number;
  @ApiPropertyOptional({ type: CurrencyAmountDto, nullable: true }) totalValue: CurrencyAmountDto | null;
  @ApiProperty() batchCount: number;

  @ApiProperty({ type: LocationItemDisplayResponseDto, description: "These quantities in the item's display unit" })
  display: LocationItemDisplayResponseDto;
}
