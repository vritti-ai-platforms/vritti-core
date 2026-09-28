import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TableResponseDto, type TableViewState } from '@vritti/api-sdk/data-table';
import { StockAdjustmentLineResponseDto } from './stock-adjustment-line-response.dto';

export class StockAdjustmentLineTableResponseDto extends TableResponseDto<StockAdjustmentLineResponseDto> {
  @ApiProperty({ type: [StockAdjustmentLineResponseDto] })
  declare result: StockAdjustmentLineResponseDto[];

  @ApiProperty()
  declare count: number;

  @ApiProperty({ description: 'Current active filter/sort/visibility state' })
  declare state: TableViewState;

  @ApiPropertyOptional()
  declare activeViewId: string | null;
}
