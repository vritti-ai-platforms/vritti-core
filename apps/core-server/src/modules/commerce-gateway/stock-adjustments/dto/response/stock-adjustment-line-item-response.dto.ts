import { ApiProperty } from '@nestjs/swagger';

export class StockAdjustmentLineItemResponseDto {
  @ApiProperty() id: string;
  @ApiProperty() stockAdjustmentLineId: string;
  @ApiProperty() inventoryItemId: string;
  @ApiProperty() quantity: number;
  @ApiProperty() createdAt: string;
}
