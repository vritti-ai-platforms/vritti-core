import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import type { TableViewState } from '@vritti/api-sdk/database';
import { TableResponseDto } from '@vritti/api-sdk/database';
import { StockTransferResponseDto } from './stock-transfer-response.dto';

export class StockTransferTableResponseDto extends TableResponseDto<StockTransferResponseDto> {
  @ApiProperty({ type: [StockTransferResponseDto] })
  declare result: StockTransferResponseDto[];

  @ApiProperty()
  declare count: number;

  @ApiProperty({ description: 'Current active filter/sort/visibility state' })
  declare state: TableViewState;

  @ApiPropertyOptional()
  declare activeViewId: string | null;
}
