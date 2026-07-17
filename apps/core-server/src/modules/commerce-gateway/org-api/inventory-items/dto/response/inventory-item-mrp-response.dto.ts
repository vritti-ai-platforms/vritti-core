import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CurrencyAmountDto } from '@vritti/api-sdk/money';

export class InventoryItemMrpResponseDto {
  @ApiProperty() id: string;
  @ApiProperty() inventoryItemId: string;
  @ApiProperty() uomId: string;
  @ApiPropertyOptional({ description: 'UOM symbol', nullable: true }) uomSymbol: string | null;
  @ApiProperty({ type: CurrencyAmountDto }) amount: CurrencyAmountDto;
  @ApiPropertyOptional({ description: 'Lot the MRP was sourced from', nullable: true }) sourceLotId: string | null;
  @ApiPropertyOptional({ description: 'When the MRP was sourced', nullable: true }) sourcedAt: string | null;
  @ApiProperty() createdAt: string;
  @ApiProperty() updatedAt: string;
}
