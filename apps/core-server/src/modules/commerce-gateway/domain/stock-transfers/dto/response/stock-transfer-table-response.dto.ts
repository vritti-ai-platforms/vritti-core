import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TableResponseDto, type TableState } from '@vritti/api-sdk/data-table';
import { StockTransferRowResponseDto } from './stock-transfer-response.dto';

export class StockTransferTableResponseDto extends TableResponseDto<StockTransferRowResponseDto> {
  @ApiProperty({ type: [StockTransferRowResponseDto] })
  declare result: StockTransferRowResponseDto[];

  @ApiProperty()
  declare count: number;

  @ApiProperty({ description: 'Current active filter/sort/visibility state' })
  declare state: TableState;

  @ApiPropertyOptional()
  declare activeViewId: string | null;
}
