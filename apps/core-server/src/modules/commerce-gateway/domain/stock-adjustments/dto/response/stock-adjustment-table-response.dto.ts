import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TableResponseDto, type TableState } from '@vritti/api-sdk/data-table';
import { StockAdjustmentResponseDto } from './stock-adjustment-response.dto';

export class StockAdjustmentTableResponseDto extends TableResponseDto<StockAdjustmentResponseDto> {
  @ApiProperty({ type: [StockAdjustmentResponseDto] })
  declare result: StockAdjustmentResponseDto[];

  @ApiProperty()
  declare count: number;

  @ApiProperty({ description: 'Current active filter/sort/visibility state' })
  declare state: TableState;

  @ApiPropertyOptional()
  declare activeViewId: string | null;
}
