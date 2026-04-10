import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import type { TableViewState } from '@vritti/api-sdk';
import { TableResponseDto } from '@vritti/api-sdk';
import { StockAdjustmentResponseDto } from './stock-adjustment-response.dto';

export class StockAdjustmentTableResponseDto extends TableResponseDto<StockAdjustmentResponseDto> {
  @ApiProperty({ type: [StockAdjustmentResponseDto] })
  declare result: StockAdjustmentResponseDto[];

  @ApiProperty()
  declare count: number;

  @ApiProperty({ description: 'Current active filter/sort/visibility state' })
  declare state: TableViewState;

  @ApiPropertyOptional()
  declare activeViewId: string | null;
}
