import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TableResponseDto, type TableState } from '@vritti/api-sdk/data-table';
import { StockAdjustmentLineItemResponseDto } from './stock-adjustment-line-item-response.dto';

export class StockAdjustmentLineItemTableResponseDto extends TableResponseDto<StockAdjustmentLineItemResponseDto> {
  @ApiProperty({ type: [StockAdjustmentLineItemResponseDto] })
  declare result: StockAdjustmentLineItemResponseDto[];

  @ApiProperty()
  declare count: number;

  @ApiProperty({ description: 'Current active filter/sort/visibility state' })
  declare state: TableState;

  @ApiPropertyOptional()
  declare activeViewId: string | null;
}
