import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CurrencyAmountDto } from '@vritti/api-sdk/money';

export class InventoryItemMrpResponseDto {
  @ApiProperty() id: string;
  @ApiProperty() inventoryItemId: string;
  @ApiProperty() uomId: string;
  @ApiProperty({ description: 'UOM symbol' }) uomSymbol: string;
  @ApiProperty({ type: CurrencyAmountDto }) amount: CurrencyAmountDto;
  @ApiPropertyOptional({ description: 'Lot the MRP was sourced from', nullable: true }) sourceLotId: string | null;
  @ApiPropertyOptional({ description: 'When the MRP was sourced', nullable: true }) sourcedAt: string | null;
  @ApiProperty({ description: 'The MRP shown on listings for this pack' }) isCurrent: boolean;
  @ApiProperty() createdAt: string;
  @ApiProperty() updatedAt: string;
}
