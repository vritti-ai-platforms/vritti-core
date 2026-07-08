import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import type { TableViewState } from '@vritti/api-sdk/database';
import { TableResponseDto } from '@vritti/api-sdk/database';
import { StockAdjustmentLineItemResponseDto } from './stock-adjustment-line-item-response.dto';

export class StockAdjustmentLineItemTableResponseDto extends TableResponseDto<StockAdjustmentLineItemResponseDto> {
  @ApiProperty({ type: [StockAdjustmentLineItemResponseDto] })
  declare result: StockAdjustmentLineItemResponseDto[];

  @ApiProperty()
  declare count: number;

  @ApiProperty({ description: 'Current active filter/sort/visibility state' })
  declare state: TableViewState;

  @ApiPropertyOptional()
  declare activeViewId: string | null;
}
