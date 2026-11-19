import { DisplayUomQuantityResponseDto } from '@commerce/uom/dto/response/display-uom-quantity-response.dto';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CurrencyAmountDto } from '@vritti/api-sdk/money';

// Per-lot row for the inventory item Lots tab — one row per inventory_item_lots row, with stock totals aggregated across quants.
export class InventoryItemLotDisplayResponseDto {
  @ApiProperty({ type: DisplayUomQuantityResponseDto, nullable: true })
  stockedQuantity: DisplayUomQuantityResponseDto | null;

  @ApiProperty({ type: DisplayUomQuantityResponseDto, nullable: true })
  reservedQuantity: DisplayUomQuantityResponseDto | null;

  @ApiProperty({ type: DisplayUomQuantityResponseDto, nullable: true })
  availableQuantity: DisplayUomQuantityResponseDto | null;
}

export class InventoryItemLotResponseDto {
  @ApiProperty() id: string;
  @ApiProperty() inventoryItemId: string;
  @ApiProperty() lotNumber: string;
  @ApiPropertyOptional({ nullable: true }) manufacturingDate: string | null;
  @ApiProperty() expiryDate: string;
  @ApiPropertyOptional({ type: () => CurrencyAmountDto, nullable: true }) mrp: CurrencyAmountDto | null;
  @ApiProperty() stockedQuantity: number;
  @ApiProperty() reservedQuantity: number;
  @ApiProperty() availableQuantity: number;
  @ApiProperty() createdAt: string;
  @ApiProperty() updatedAt: string;

  @ApiProperty({ type: InventoryItemLotDisplayResponseDto, description: "These quantities in the item's display unit" })
  display: InventoryItemLotDisplayResponseDto;
}
