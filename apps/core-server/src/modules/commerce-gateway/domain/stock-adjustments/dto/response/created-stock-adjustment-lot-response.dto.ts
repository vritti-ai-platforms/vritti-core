import { ApiProperty } from '@nestjs/swagger';

export class CreatedStockAdjustmentLotResponseDto {
  @ApiProperty({ description: 'The new lot' })
  id: string;

  @ApiProperty({ description: 'Its lot number' })
  lotNumber: string;
}
