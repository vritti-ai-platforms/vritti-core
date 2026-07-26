import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CurrencyAmountDto } from '@vritti/api-sdk/money';

// Per-lot row for the inventory item Lots tab — one row per inventory_item_lots row, with stock totals aggregated across quants.
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
}
