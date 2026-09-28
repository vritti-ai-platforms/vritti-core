import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TableResponseDto, type TableViewState } from '@vritti/api-sdk/data-table';
import { GoodsReceiptLineResponseDto } from './goods-receipt-line-response.dto';

export class GoodsReceiptLineTableResponseDto extends TableResponseDto<GoodsReceiptLineResponseDto> {
  @ApiProperty({ type: [GoodsReceiptLineResponseDto] })
  declare result: GoodsReceiptLineResponseDto[];

  @ApiProperty()
  declare count: number;

  @ApiProperty({ description: 'Current active filter/sort/visibility state' })
  declare state: TableViewState;

  @ApiPropertyOptional()
  declare activeViewId: string | null;
}
