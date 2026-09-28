import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TableResponseDto, type TableViewState } from '@vritti/api-sdk/data-table';
import { GoodsReceiptLineItemResponseDto } from './goods-receipt-line-item-response.dto';

export class GoodsReceiptLineItemTableResponseDto extends TableResponseDto<GoodsReceiptLineItemResponseDto> {
  @ApiProperty({ type: [GoodsReceiptLineItemResponseDto] })
  declare result: GoodsReceiptLineItemResponseDto[];

  @ApiProperty()
  declare count: number;

  @ApiProperty({ description: 'Current active filter/sort/visibility state' })
  declare state: TableViewState;

  @ApiPropertyOptional()
  declare activeViewId: string | null;
}
