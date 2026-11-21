import { ApiProperty } from '@nestjs/swagger';

export class StockAdjustmentCountsResponseDto {
  @ApiProperty({ description: 'Lines on the adjustment, those under a draft lot included', example: 6 })
  lineCount: number;

  @ApiProperty({
    description: 'Draft lots the adjustment opens; only opening stock of a lot-tracked item has them',
    example: 2,
  })
  lotCount: number;
}
