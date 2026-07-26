import { ApiProperty } from '@nestjs/swagger';

export class StockAdjustmentLineItemResponseDto {
  @ApiProperty() id: string;
  @ApiProperty() stockAdjustmentLineId: string;
  @ApiProperty() serialNumber: string;
  @ApiProperty() createdAt: string;
}
