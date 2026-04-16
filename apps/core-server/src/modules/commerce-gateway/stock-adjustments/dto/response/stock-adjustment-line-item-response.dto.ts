import { ApiProperty } from '@nestjs/swagger';

export class StockAdjustmentLineItemResponseDto {
  @ApiProperty() id: string;
  @ApiProperty() stockAdjustmentLineId: string;
  @ApiProperty() quantity: number;
  @ApiProperty() createdAt: string;
}
