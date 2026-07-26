import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import type { TableViewState } from '@vritti/api-sdk/database';
import { TableResponseDto } from '@vritti/api-sdk/database';
import { GoodsReceiptResponseDto } from './goods-receipt-response.dto';

export class GoodsReceiptTableResponseDto extends TableResponseDto<GoodsReceiptResponseDto> {
  @ApiProperty({ type: [GoodsReceiptResponseDto] })
  declare result: GoodsReceiptResponseDto[];

  @ApiProperty()
  declare count: number;

  @ApiProperty({ description: 'Current active filter/sort/visibility state' })
  declare state: TableViewState;

  @ApiPropertyOptional()
  declare activeViewId: string | null;
}
